"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Map as MapCanvas,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerTooltip,
  type MapViewport,
  useMap,
} from "@/components/ui/map";
import type { Filters } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Position = {
  latitude: number;
  longitude: number;
  speed?: number | null;
  timestamp?: string;
};

type Location = {
  name: string;
  latitude: number;
  longitude: number;
  city?: string;
  address?: string;
};

type TrackedTrip = {
  id: number;
  status: "ON_TRIP" | "COMPLETED";
  driver?: { name: string };
  origin?: Location;
  destination?: Location;
  vehicle?: { plate: string };
  positions?: Position[];
  latestPosition?: Position;
  displaySpeed?: number;
};

type RouteRequest = {
  key: string;
  coordinates: [number, number][];
};

function snapPositionToRoute(
  position: Position,
  route: [number, number][],
): [number, number] {
  if (route.length < 2) return [position.longitude, position.latitude];

  const longitudeScale = Math.cos((position.latitude * Math.PI) / 180);
  const pointX = position.longitude * longitudeScale;
  const pointY = position.latitude;
  let nearestPoint: [number, number] = [position.longitude, position.latitude];
  let nearestDistance = Infinity;

  for (let index = 0; index < route.length - 1; index += 1) {
    const start = route[index];
    const end = route[index + 1];
    const startX = start[0] * longitudeScale;
    const startY = start[1];
    const deltaX = (end[0] - start[0]) * longitudeScale;
    const deltaY = end[1] - start[1];
    const segmentLengthSquared = deltaX * deltaX + deltaY * deltaY;
    const progress =
      segmentLengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((pointX - startX) * deltaX + (pointY - startY) * deltaY) /
                segmentLengthSquared,
            ),
          );
    const candidate: [number, number] = [
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress,
    ];
    const distanceX = candidate[0] * longitudeScale - pointX;
    const distanceY = candidate[1] - pointY;
    const distance = distanceX * distanceX + distanceY * distanceY;

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = candidate;
    }
  }

  return nearestPoint;
}

function CityBuildings() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    const layerId = "voms-city-buildings";
    if (!map || !isLoaded || !map.getSource("carto") || map.getLayer(layerId)) {
      return;
    }

    const firstSymbolLayer = map
      .getStyle()
      .layers.find((layer) => layer.type === "symbol");

    map.addLayer(
      {
        id: layerId,
        type: "fill-extrusion",
        source: "carto",
        "source-layer": "building",
        minzoom: 12,
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-extrusion-base": ["to-number", ["get", "render_min_height"], 0],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            0,
            14,
            ["to-number", ["get", "render_height"], 12],
          ],
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["to-number", ["get", "render_height"], 12],
            8,
            "#10343d",
            24,
            "#12616b",
            80,
            "#39bfc4",
          ],
          "fill-extrusion-opacity": 0.82,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      firstSymbolLayer?.id,
    );

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    };
  }, [map, isLoaded]);

  return null;
}

interface Props {
  filters: Filters;
}

export default function LiveFleetMapCard({ filters }: Props) {
  const { data: session, status } = useSession();
  const [trips, setTrips] = useState<TrackedTrip[]>([]);
  const [roadRoutes, setRoadRoutes] = useState<
    Record<string, [number, number][]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasCenteredOnTrip = useRef(false);
  const [viewport, setViewport] = useState<MapViewport>({
    center: [106.8, -6.2],
    zoom: 12.2,
    bearing: -12,
    pitch: 52,
  });

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;
    let active = true;

    const loadTrips = async () => {
      try {
        const params = new URLSearchParams({
          dateType: filters.dateType,
          includeTrack: "true",
        });
        if (filters.dateValue) params.set("dateValue", filters.dateValue);
        if (
          filters.driver &&
          filters.driver !== "Select Driver" &&
          filters.driver !== "No drivers available"
        ) {
          params.set("driverName", filters.driver);
        }
        if (
          filters.route &&
          filters.route !== "Select Origin" &&
          filters.route !== "No origins available"
        ) {
          params.set("originName", filters.route);
        }
        if (
          filters.departureRoute &&
          filters.departureRoute !== "Select Departure" &&
          filters.departureRoute !== "No departures available"
        ) {
          params.set("destinationName", filters.departureRoute);
        }

        const response = await fetch(
          `${API_URL}/api/trips/filter?${params.toString()}`,
          {
            cache: "no-store",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        );
        if (!response.ok) throw new Error("Failed to load live trips");

        const result = await response.json();
        if (!result.success || !Array.isArray(result.trips)) {
          throw new Error("Unexpected map response");
        }
        if (active) {
          setTrips(result.trips);
          setError("");
        }
      } catch {
        if (active) setError("Live fleet data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTrips();
    const interval = setInterval(loadTrips, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [
    filters.dateType,
    filters.dateValue,
    filters.departureRoute,
    filters.driver,
    filters.route,
    session?.accessToken,
    status,
  ]);

  const tripsForMap = trips.flatMap((trip) => {
    const { origin, destination } = trip;
    if (!origin || !destination) return [];

    const routeKey = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const gpsCoordinates = (trip.positions || [])
      .filter(
        (position) =>
          Number.isFinite(position.latitude) &&
          Number.isFinite(position.longitude),
      )
      .map((position): [number, number] => [
        position.longitude,
        position.latitude,
      ]);
    const hasGpsTrack = gpsCoordinates.length > 1;
    const directCoordinates: [number, number][] = [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ];

    return [
      {
        trip,
        origin,
        destination,
        position: trip.latestPosition || trip.positions?.at(-1),
        routeKey,
        gpsCoordinates,
        directCoordinates,
        hasGpsTrack,
      },
    ];
  });
  const primaryTripId = tripsForMap[0]?.trip.id;

  const routeRequests = Array.from(
    new Map(
      tripsForMap
        .filter(
          ({ trip, hasGpsTrack }) => trip.id === primaryTripId && !hasGpsTrack,
        )
        .map(({ routeKey, directCoordinates }) => [
          routeKey,
          { key: routeKey, coordinates: directCoordinates },
        ]),
    ).values(),
  );
  const routeRequestSignature = JSON.stringify(routeRequests);

  useEffect(() => {
    const requests = JSON.parse(routeRequestSignature) as RouteRequest[];
    if (!requests.length) {
      setRoadRoutes({});
      return;
    }

    const controller = new AbortController();
    let active = true;

    const fetchRoadRoutes = async () => {
      const results = await Promise.all(
        requests.map(async (request) => {
          const [start, end] = request.coordinates;
          const url = new URL(
            `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}`,
          );
          url.searchParams.set("overview", "full");
          url.searchParams.set("geometries", "geojson");
          url.searchParams.set("steps", "false");

          try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) return null;

            const result = await response.json();
            const coordinates = result.routes?.[0]?.geometry?.coordinates;
            if (!Array.isArray(coordinates)) return null;

            const validCoordinates = coordinates.filter(
              (coordinate): coordinate is [number, number] =>
                Array.isArray(coordinate) &&
                Number.isFinite(coordinate[0]) &&
                Number.isFinite(coordinate[1]),
            );
            if (validCoordinates.length < 2) return null;

            return [request.key, validCoordinates] as const;
          } catch {
            return null;
          }
        }),
      );

      if (!active) return;
      setRoadRoutes(
        Object.fromEntries(results.filter((result) => result !== null)),
      );
    };

    void fetchRoadRoutes();
    return () => {
      active = false;
      controller.abort();
    };
  }, [routeRequestSignature]);

  const mappedTrips = tripsForMap.map(
    ({
      trip,
      origin,
      destination,
      position,
      routeKey,
      gpsCoordinates,
      directCoordinates,
      hasGpsTrack,
    }) => {
      const roadCoordinates = roadRoutes[routeKey];
      const coordinates: [number, number][] = hasGpsTrack
        ? [
            [origin.longitude, origin.latitude],
            ...gpsCoordinates,
            [destination.longitude, destination.latitude],
          ]
        : roadCoordinates || directCoordinates;

      return {
        trip,
        origin,
        destination,
        position,
        routeKey,
        coordinates,
        hasGpsTrack,
        hasRoadRoute: !hasGpsTrack && Boolean(roadCoordinates),
      };
    },
  );
  const routeToShow = mappedTrips[0];
  const vehiclesOnRoute = routeToShow
    ? mappedTrips
        .filter((trip) => trip.routeKey === routeToShow.routeKey)
        .map((trip) => ({
          ...trip,
          markerCoordinates: trip.position
            ? routeToShow.hasGpsTrack || routeToShow.hasRoadRoute
              ? snapPositionToRoute(trip.position, routeToShow.coordinates)
              : [trip.position.longitude, trip.position.latitude]
            : null,
        }))
    : [];
  const firstPosition = mappedTrips[0]?.position;
  const firstLatitude = firstPosition?.latitude;
  const firstLongitude = firstPosition?.longitude;

  useEffect(() => {
    if (
      firstLatitude === undefined ||
      firstLongitude === undefined ||
      hasCenteredOnTrip.current
    ) {
      return;
    }
    hasCenteredOnTrip.current = true;
    setViewport((current) => ({
      ...current,
      center: [firstLongitude, firstLatitude],
      zoom: Math.max(current.zoom, 12.2),
    }));
  }, [firstLatitude, firstLongitude]);

  return (
    <section className='overflow-hidden rounded-xl border border-white/10 bg-[#0D1117] shadow-xl shadow-black/20'>
      <div className='flex items-center justify-between gap-4 px-5 py-4'>
        <div>
          <h2 className='text-base font-semibold text-white'>Trip route map</h2>
          <p className='mt-1 text-sm text-gray-400'>
            {loading
              ? "Loading live positions…"
              : `${vehiclesOnRoute.length} vehicles · ${routeToShow ? "1 shared route" : "no route available"}`}
          </p>
        </div>
        <span className='flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-medium text-emerald-300'>
          <span className='h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]' />
          Synced every 30 sec
        </span>
      </div>

      <div className='relative h-90 border-t border-white/10 sm:h-105'>
        <MapCanvas
          className='dark h-full w-full'
          theme='dark'
          scrollZoom
          touchZoomRotate
          touchPitch
          pitchWithRotate={false}
          maxPitch={65}
          maxZoom={19}
          viewport={viewport}
          onViewportChange={setViewport}
        >
          <CityBuildings />
          <MapControls position='bottom-right' showCompass showFullscreen />

          <div className='pointer-events-none absolute left-4 top-4 z-10 rounded-sm border border-cyan-300/20 bg-[#031016]/75 px-3 py-2 backdrop-blur-md'>
            <p className='font-mono text-[9px] uppercase text-cyan-300/80'>
              VOMS / Spatial telemetry
            </p>
            <p className='mt-1 font-mono text-xs text-white'>
              {vehiclesOnRoute.length.toString().padStart(2, "0")} VEHICLES ON
              ROUTE
            </p>
          </div>

          <div className='pointer-events-none absolute bottom-3 left-4 z-10 flex items-center gap-4 rounded-sm border border-white/10 bg-[#031016]/80 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-md'>
            <span className='flex items-center gap-2'>
              <span className='h-0.5 w-5 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.75)]' />
              Selected route
            </span>
            {routeToShow &&
              !routeToShow.hasGpsTrack &&
              !routeToShow.hasRoadRoute && (
                <span className='flex items-center gap-2'>
                  <span className='h-0.5 w-5 border-t border-dashed border-slate-400' />
                  Estimated
                </span>
              )}
          </div>

          {vehiclesOnRoute.map(
            ({
              trip,
              position,
              markerCoordinates,
              origin,
              destination,
              coordinates,
              hasGpsTrack,
              hasRoadRoute,
            }) => {
              return (
                <div key={trip.id}>
                  {trip.id === routeToShow?.trip.id && (
                    <>
                      <MapRoute
                        id={`trip-${trip.id}-glow`}
                        coordinates={coordinates}
                        color='#fbbf24'
                        opacity={0.2}
                        width={12}
                        dashArray={
                          hasGpsTrack || hasRoadRoute ? undefined : [2, 2]
                        }
                        interactive={false}
                      />
                      <MapRoute
                        id={`trip-${trip.id}`}
                        coordinates={coordinates}
                        color='#fbbf24'
                        opacity={1}
                        width={2.5}
                        dashArray={
                          hasGpsTrack || hasRoadRoute ? undefined : [2, 2]
                        }
                        interactive={false}
                      />
                    </>
                  )}
                  <MapMarker
                    longitude={origin.longitude}
                    latitude={origin.latitude}
                    anchor='center'
                  >
                    <MarkerContent className='h-3.5 w-3.5 rounded-sm border border-cyan-100 bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.9)]' />
                    <MarkerTooltip className='w-52 border border-cyan-400/30 bg-[#06131a] p-3 text-slate-100 shadow-[0_0_24px_rgba(34,211,238,0.18)]'>
                      <div className='space-y-1'>
                        <p className='text-[9px] font-semibold uppercase text-cyan-300'>
                          Origin warehouse
                        </p>
                        <p className='text-sm font-semibold text-white'>
                          {origin.name}
                        </p>
                        {origin.city && (
                          <p className='text-xs text-slate-400'>
                            {origin.city}
                          </p>
                        )}
                        <p className='font-mono text-[10px] text-slate-500'>
                          {origin.latitude.toFixed(5)},{" "}
                          {origin.longitude.toFixed(5)}
                        </p>
                      </div>
                    </MarkerTooltip>
                  </MapMarker>
                  {position && (
                    <MapMarker
                      longitude={markerCoordinates?.[0] ?? position.longitude}
                      latitude={markerCoordinates?.[1] ?? position.latitude}
                      anchor='center'
                    >
                      <MarkerContent
                        className={`h-5 w-5 rounded-sm border-2 border-cyan-50 shadow-[0_0_0_4px_rgba(34,211,238,0.16),0_0_18px_rgba(34,211,238,0.8)] ${trip.status === "ON_TRIP" ? "rotate-45 bg-cyan-300" : "rotate-45 bg-fuchsia-400"}`}
                      />
                      <MarkerTooltip className='w-56 border border-cyan-400/30 bg-[#06131a] p-3 text-slate-100 shadow-[0_0_28px_rgba(34,211,238,0.2)]'>
                        <div className='space-y-2'>
                          <div className='flex items-start justify-between gap-3'>
                            <div>
                              <p className='text-[9px] font-semibold uppercase text-cyan-300'>
                                Vehicle telemetry
                              </p>
                              <p className='mt-1 text-sm font-semibold text-white'>
                                {trip.vehicle?.plate || `Trip #${trip.id}`}
                              </p>
                            </div>
                            <span
                              className={`mt-1 h-2 w-2 rounded-full ${trip.status === "ON_TRIP" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)]"}`}
                            />
                          </div>
                          <div className='grid grid-cols-2 gap-2 border-y border-white/10 py-2'>
                            <div>
                              <p className='text-[9px] uppercase text-slate-500'>
                                Driver
                              </p>
                              <p className='mt-0.5 text-xs text-slate-200'>
                                {trip.driver?.name || "Unavailable"}
                              </p>
                            </div>
                            <div>
                              <p className='text-[9px] uppercase text-slate-500'>
                                Speed
                              </p>
                              <p className='mt-0.5 font-mono text-xs text-cyan-200'>
                                {position.speed ?? trip.displaySpeed ?? 0} km/h
                              </p>
                            </div>
                          </div>
                          <p className='font-mono text-[10px] text-slate-500'>
                            {position.latitude.toFixed(5)},{" "}
                            {position.longitude.toFixed(5)}
                          </p>
                          {position.timestamp && (
                            <p className='text-[10px] text-slate-500'>
                              {new Date(position.timestamp).toLocaleString(
                                "id-ID",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                },
                              )}
                            </p>
                          )}
                        </div>
                      </MarkerTooltip>
                    </MapMarker>
                  )}
                  <MapMarker
                    longitude={destination.longitude}
                    latitude={destination.latitude}
                    anchor='center'
                  >
                    <MarkerContent className='h-3.5 w-3.5 rounded-sm border border-emerald-100 bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]' />
                    <MarkerTooltip className='w-52 border border-emerald-400/30 bg-[#06131a] p-3 text-slate-100 shadow-[0_0_24px_rgba(52,211,153,0.16)]'>
                      <div className='space-y-1'>
                        <p className='text-[9px] font-semibold uppercase text-emerald-300'>
                          Destination warehouse
                        </p>
                        <p className='text-sm font-semibold text-white'>
                          {destination.name}
                        </p>
                        {destination.city && (
                          <p className='text-xs text-slate-400'>
                            {destination.city}
                          </p>
                        )}
                        <p className='font-mono text-[10px] text-slate-500'>
                          {destination.latitude.toFixed(5)},{" "}
                          {destination.longitude.toFixed(5)}
                        </p>
                      </div>
                    </MarkerTooltip>
                  </MapMarker>
                </div>
              );
            },
          )}
        </MapCanvas>

        {!loading && (error || mappedTrips.length === 0) && (
          <div className='absolute inset-x-0 bottom-3 mx-auto w-fit rounded-md border border-white/10 bg-[#0D1117]/95 px-3 py-2 text-sm text-gray-300 shadow-lg'>
            {error || "No trips match the selected filters."}
          </div>
        )}
      </div>
    </section>
  );
}
