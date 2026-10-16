"use client";

import { useMemo, useState } from "react";
import VehicleCard from "./VehicleCard";

export type VehicleStatus = "active" | "trip" | "alert" | "idle" | "off";

export type VehicleItem = {
  id?: string;
  code: string;
  name?: string;
  driver?: string;
  status: VehicleStatus;
  speed: string | number;
  route: string;
  position: [number, number];
};

const VEHICLES: VehicleItem[] = [
  {
    code: "TRK-8821",
    name: "John Doe",
    status: "trip",
    speed: "65 km/h",
    route: "Jakarta – Bogor",
    position: [-6.21, 106.82],
  },
  {
    code: "TRK-9900",
    name: "Mike R.",
    status: "alert",
    speed: "0 km/h",
    route: "Jakarta – Bandung",
    position: [-6.18, 106.85],
  },
  {
    code: "FLT-2210",
    name: "Alex K.",
    status: "active",
    speed: "42 km/h",
    route: "Jakarta – Semarang",
    position: [-6.24, 106.81],
  },
  {
    code: "VSL-9921",
    name: "Sarah M.",
    status: "idle",
    speed: "0 km/h",
    route: "Jakarta – Bogor",
    position: [-6.22, 106.83],
  },
  {
    code: "XYZ-9001",
    name: "David L.",
    status: "off",
    speed: "-",
    route: "Jakarta – Bandung",
    position: [-6.23, 106.8],
  },
];

type Props = {
  vehicles?: VehicleItem[];
  selectedVehicleId?: string | null;
  onSelectVehicle: (code: string) => void;
  onFilterChange?: (vehicles: VehicleItem[]) => void;
};

export default function VehiclePanel({
  vehicles: propsVehicles,
  selectedVehicleId,
  onSelectVehicle,
  onFilterChange,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");

  const sourceVehicles =
    propsVehicles && propsVehicles.length > 0 ? propsVehicles : VEHICLES;

  const filteredVehicles = useMemo(() => {
    const result = sourceVehicles.filter((v) => {
      const matchSearch =
        v.code.toLowerCase().includes(search.toLowerCase()) ||
        (v.name ?? v.driver ?? "").toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || v.status === statusFilter;

      const matchRoute = routeFilter === "all" || v.route === routeFilter;

      return matchSearch && matchStatus && matchRoute;
    });

    // ✅ AMAN: tidak akan error walau prop tidak dikirim
    if (typeof onFilterChange === "function") {
      onFilterChange(result);
    }

    return result;
  }, [search, statusFilter, routeFilter, sourceVehicles, onFilterChange]);

  return (
    <aside className='w-full h-full flex flex-col bg-[#0F172A] border-l border-white/5'>
      {/* ================= HEADER ================= */}
      <div className='px-4 py-4 border-b border-white/5 space-y-3'>
        <div className='flex items-center justify-between gap-3'>
          <h3 className='text-sm font-semibold text-white'>
            Fleet Tracking ({filteredVehicles.length})
          </h3>
          <span className='rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400'>
            Live
          </span>
        </div>

        <input
          placeholder='Search vehicle or driver...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full px-3 py-2 bg-[#020617] border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500'
        />

        <div className='flex gap-2'>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='flex-1 bg-[#020617] border border-white/10 rounded-lg text-xs text-white px-2 py-1'
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='trip'>Trip</option>
            <option value='alert'>Alert</option>
            <option value='idle'>Idle</option>
            <option value='off'>Off</option>
          </select>

          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className='flex-1 bg-[#020617] border border-white/10 rounded-lg text-xs text-white px-2 py-1'
          >
            <option value='all'>All Routes</option>
            <option value='Jakarta – Bogor'>Jakarta – Bogor</option>
            <option value='Jakarta – Bandung'>Jakarta – Bandung</option>
            <option value='Jakarta – Semarang'>Jakarta – Semarang</option>
          </select>
        </div>
      </div>

      {/* ================= LIST ================= */}
      <div className='flex-1 overflow-y-auto px-4 py-4 space-y-3'>
        {filteredVehicles.map((v) => (
          <div
            key={v.code}
            className={
              selectedVehicleId === v.code
                ? "ring-2 ring-cyan-500/60 rounded-xl"
                : ""
            }
          >
            <VehicleCard
              code={v.code}
              name={v.name ?? v.driver ?? "Unassigned"}
              status={v.status}
              speed={typeof v.speed === "number" ? `${v.speed} km/h` : v.speed}
              route={v.route}
              onClick={() => onSelectVehicle(v.code)}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
