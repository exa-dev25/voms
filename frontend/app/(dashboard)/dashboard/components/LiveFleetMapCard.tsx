"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* =========================
   DYNAMIC REACT-LEAFLET
========================= */
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false });

/* =========================
   TYPES
========================= */
type Warehouse = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

type RouteCache = {
  [tripId: number]: [number, number][];
};

export default function LiveFleetMapCard() {
  const [warehouseIcon, setWarehouseIcon] = useState<any>(null);
  const [truckIcon, setTruckIcon] = useState<any>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [routes, setRoutes] = useState<RouteCache>({});
  const [loading, setLoading] = useState(true);

  const routeLoadingRef = useRef<Set<number>>(new Set());

  /* =========================
     LOAD LEAFLET ICONS
  ========================= */
  useEffect(() => {
    (async () => {
      const L = await import("leaflet");

      setWarehouseIcon(
        new L.Icon({
          iconUrl: "https://images.icon-icons.com/3136/PNG/96/warehouse_storage_unit_storehouse_icon_192428.png",
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        })
      );

      setTruckIcon(
        new L.Icon({
          iconUrl: "https://images.icon-icons.com/522/PNG/96/truck_icon-icons.com_52347.png",
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      );
    })();
  }, []);

  /* =========================
     FETCH ROUTE FROM OSRM
  ========================= */
  const fetchRouteOSRM = async (trip: any) => {
    if (routes[trip.id]) return;
    if (routeLoadingRef.current.has(trip.id)) return;

    routeLoadingRef.current.add(trip.id);

    try {
      const o = trip.assignment.origin;
      const d = trip.assignment.destination;

      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${o.longitude},${o.latitude};${d.longitude},${d.latitude}` +
        `?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const json = await res.json();

      const coords = json.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      setRoutes(prev => ({
        ...prev,
        [trip.id]: coords
      }));
    } catch (e) {
      console.error("OSRM route error", e);
    }
  };

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    let interval: any;

    const load = async () => {
      try {
        const [wh, mapData] = await Promise.all([
          fetch(`${API_URL}/api/warehouses`).then(r => r.json()),
          fetch(`${API_URL}/api/dashboard/map`).then(r => r.json())
        ]);

        setWarehouses(wh);
        setTrips(mapData);

        mapData.forEach(fetchRouteOSRM);
      } catch (e) {
        console.error("Map load error", e);
      } finally {
        setLoading(false);
      }

      interval = setInterval(async () => {
        const mapData = await fetch(`${API_URL}/api/dashboard/map`).then(r => r.json());
        setTrips(mapData);
        mapData.forEach(fetchRouteOSRM);
      }, 5000);
    };

    load();
    return () => clearInterval(interval);
  }, []);

  if (!warehouseIcon || !truckIcon || loading) {
    return (
      <div className="h-[420px] flex items-center justify-center text-gray-400">
        Loading map...
      </div>
    );
  }

  return (
    <div className="bg-[#0D1117] border border-white/10 rounded-xl p-4 h-[460px]">
      <h3 className="text-white font-semibold mb-2">Live Fleet Tracking</h3>

      <MapContainer center={[-6.5, 107]} zoom={6} style={{ height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 🏢 WAREHOUSES */}
        {warehouses.map(w => (
          <Marker key={`wh-${w.id}`} position={[w.latitude, w.longitude]} icon={warehouseIcon}>
            <Popup>
              <b>{w.name}</b>
            </Popup>
          </Marker>
        ))}

        {/* 🚚 TRIPS */}
        {trips.map(trip => {
          const pos = trip.assignment.vehicle.positions[0];
          if (!pos) return null;

          return (
            <div key={trip.id}>
              {/* 🔵 REAL ROUTE */}
              {routes[trip.id] && (
                <Polyline
                  positions={routes[trip.id]}
                  pathOptions={{ color: "#3b82f6", weight: 4 }}
                />
              )}

              {/* 🚚 TRUCK */}
              <Marker position={[pos.latitude, pos.longitude]} icon={truckIcon}>
                <Popup>
                  🚚 <b>{trip.assignment.vehicle.plate}</b><br />
                  👤 {trip.assignment.driver.name}<br />
                  ⚡ {pos.speed ?? 0} km/h<br />
                  📍 {trip.assignment.origin.name} → {trip.assignment.destination.name}
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
