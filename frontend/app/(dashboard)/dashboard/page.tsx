"use client";

import { useState } from "react";

import { ProtectedPage } from "@/components/ProtectedPage";
import FilterSection from "@/components/FilterSection";
import DataTable from "@/components/DataTable";

import StatsOverview from "./components/StatsOverview";
import LiveFleetMapCard from "./components/LiveFleetMapCard";
import PerformanceChart from "./components/PerformanceChart";
import TripStatusDonut from "./components/TripStatusDonut";

import { Filters } from "@/types";

export default function DashboardPage() {
  /* =======================
   * FILTER STATE
   * ======================= */
  const [filters, setFilters] = useState<Filters>({
    dateType: "current",
    dateValue: "",
    driver: "",
    route: "",
    departureRoute: "",
  });

  const [draftFilters, setDraftFilters] = useState<Filters>(filters);

  const handleApplyFilters = () => {
    setFilters(draftFilters);
  };

  const handleClearFilters = () => {
    const reset: Filters = {
      dateType: "current",
      dateValue: "",
      driver: "",
      route: "",
      departureRoute: "",
    };
    setDraftFilters(reset);
    setFilters(reset);
  };

  /* =======================
   * RENDER
   * ======================= */
  return (
    <ProtectedPage requiredRole='VIEWER'>
      <div className='p-6 space-y-8 bg-[#0a0e1a] min-h-screen'>
        {/* ================= HEADER ================= */}
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-xs uppercase tracking-[0.24em] text-cyan-400 font-semibold'>
              Control tower
            </p>
            <h1 className='text-3xl font-bold text-white mt-2'>
              Executive Overview
            </h1>
            <p className='text-gray-400 mt-1'>
              Fleet health, delivery performance, alert status, and route risk
              in one view.
            </p>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <StatsOverview />

        {/* ================= MAP ================= */}
        <LiveFleetMapCard filters={filters} />

        {/* ================= FILTER AND TABLE ================= */}
        <section className='space-y-4'>
          <FilterSection
            filters={draftFilters}
            onFilterChange={setDraftFilters}
            onClear={handleClearFilters}
            onApply={handleApplyFilters}
          />
          <DataTable filters={filters} />
        </section>

        {/* ================= CHARTS ================= */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <div className='xl:col-span-2'>
            <PerformanceChart />
          </div>
          <TripStatusDonut />
        </div>

        {/* ================= ALERTS & ACTIVITY ================= */}
        <div className='grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-6'>
          <div className='bg-[#0D1117] border border-white/10 rounded-xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-white font-semibold text-lg'>
                Security Alerts
              </h3>
              <span className='text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-1'>
                4 active
              </span>
            </div>

            <div className='space-y-3'>
              {[
                {
                  level: "Critical",
                  text: "Vehicle off-route for 12 min",
                  time: "2 min ago",
                },
                {
                  level: "High",
                  text: "Driver separation detected",
                  time: "7 min ago",
                },
                {
                  level: "Warning",
                  text: "ETA deviation on route R-204",
                  time: "14 min ago",
                },
                {
                  level: "Info",
                  text: "Checkpoint delay at warehouse",
                  time: "22 min ago",
                },
              ].map((alert) => (
                <div
                  key={alert.level}
                  className='flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2'
                >
                  <div className='flex items-center gap-3'>
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${
                        alert.level === "Critical"
                          ? "bg-red-500"
                          : alert.level === "High"
                            ? "bg-orange-500"
                            : alert.level === "Warning"
                              ? "bg-yellow-500"
                              : "bg-cyan-500"
                      }`}
                    />
                    <div>
                      <p className='text-sm font-medium text-white'>
                        {alert.level}
                      </p>
                      <p className='text-xs text-gray-400'>{alert.text}</p>
                    </div>
                  </div>
                  <span className='text-[10px] text-gray-400 whitespace-nowrap'>
                    {alert.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-[#0D1117] border border-white/10 rounded-xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-white font-semibold text-lg'>
                Recent Activity
              </h3>
              <span className='text-xs text-gray-400'>Today</span>
            </div>

            <div className='space-y-4'>
              {[
                "Trip TR-8821 arrived at checkpoint 2",
                "Vehicle FL-2210 resumed route after stop",
                "POD submitted for shipment SH-3341",
                "ETA updated for route Jakarta - Bandung",
              ].map((activity, index) => (
                <div key={activity} className='flex gap-3'>
                  <div className='mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400' />
                  <div className='flex-1'>
                    <p className='text-sm text-gray-200'>{activity}</p>
                    <p className='text-[11px] text-gray-500 mt-1'>
                      {index * 6 + 8} minutes ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
