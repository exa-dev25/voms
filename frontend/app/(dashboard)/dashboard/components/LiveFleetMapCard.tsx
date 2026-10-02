"use client";

import { Fragment, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false },
);
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), {
  ssr: false,
});

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
};

type ActiveTrip = {
  id: number;
  assignment?: {
    driver?: { name: string };
    origin?: Location;
    destination?: Location;
    vehicle?: { plate: string; positions?: Position[] };
  };
};

export default function LiveFleetMapCard() {
  const { data: session, status } = useSession();
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;
    let active = true;

    const loadTrips = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/map`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (!response.ok) throw new Error("Failed to load live trips");

        const result = await response.json();
        if (!Array.isArray(result)) throw new Error("Unexpected map response");
        if (active) {
          setTrips(result);
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
  }, [session?.accessToken, status]);

  const mappedTrips = trips.flatMap((trip) => {
    const assignment = trip.assignment;
    const position = assignment?.vehicle?.positions?.[0];
    const origin = assignment?.origin;
    const destination = assignment?.destination;
    if (!assignment || !origin || !destination || !position) return [];
    return [{ trip, assignment, position, origin, destination }];
  });
  const first = mappedTrips[0];
  const center: [number, number] = first
    ? [first.position.latitude, first.position.longitude]
    : [-6.2, 106.8];

  return (
    <section className='overflow-hidden rounded-lg border border-slate-200 bg-white'>
      <div className='flex items-center justify-between gap-4 px-5 py-4'>
        <div>
          <h2 className='text-base font-semibold text-slate-900'>
            Live fleet tracking
          </h2>
          <p className='mt-1 text-sm text-slate-500'>
            {loading
              ? "Loading live positions…"
              : `${mappedTrips.length} active vehicles`}
          </p>
        </div>
        <span className='flex items-center gap-2 text-xs font-medium text-slate-600'>
          <span className='h-2 w-2 rounded-full bg-emerald-500' />
          Updated every 30 sec
        </span>
      </div>

      <div className='relative h-[360px] border-t border-slate-200 sm:h-[420px]'>
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {mappedTrips.map(
            ({ trip, assignment, position, origin, destination }) => (
              <Fragment key={trip.id}>
                <Polyline
                  positions={[
                    [origin.latitude, origin.longitude],
                    [position.latitude, position.longitude],
                    [destination.latitude, destination.longitude],
                  ]}
                  pathOptions={{ color: "#397cf6", opacity: 0.85, weight: 4 }}
                />
                <CircleMarker
                  center={[origin.latitude, origin.longitude]}
                  radius={5}
                  pathOptions={{
                    color: "#fff",
                    fillColor: "#64748b",
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Tooltip direction='top' offset={[0, -6]}>
                    {origin.name}
                  </Tooltip>
                </CircleMarker>
                <CircleMarker
                  center={[position.latitude, position.longitude]}
                  radius={9}
                  pathOptions={{
                    color: "#fff",
                    fillColor: "#397cf6",
                    fillOpacity: 1,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <strong>{assignment.vehicle?.plate}</strong>
                    <br />
                    {assignment.driver?.name || "Driver unavailable"}
                    <br />
                    {position.speed ?? 0} km/h
                  </Popup>
                </CircleMarker>
                <CircleMarker
                  center={[destination.latitude, destination.longitude]}
                  radius={5}
                  pathOptions={{
                    color: "#fff",
                    fillColor: "#10b981",
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Tooltip direction='top' offset={[0, -6]}>
                    {destination.name}
                  </Tooltip>
                </CircleMarker>
              </Fragment>
            ),
          )}
        </MapContainer>

        {!loading && (error || mappedTrips.length === 0) && (
          <div className='absolute inset-x-0 bottom-3 mx-auto w-fit rounded-md bg-white/95 px-3 py-2 text-sm text-slate-600 shadow'>
            {error || "No active trips with GPS positions."}
          </div>
        )}
      </div>
    </section>
  );
}
