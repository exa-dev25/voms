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
            <h1 className='text-3xl font-bold text-white'>
              Executive Overview
            </h1>
            <p className='text-gray-400 mt-1'>
              High-level operational performance metrics and live fleet status.
            </p>
          </div>

          <button
            onClick={() => console.log("Download data")}
            className='
              px-4 py-2 rounded-lg text-sm font-medium
              bg-cyan-600 text-white
              hover:bg-cyan-700 transition
            '
          >
            Download Data
          </button>
        </div>

        {/* ================= STATS ================= */}
        <StatsOverview />

        {/* ================= MAP ================= */}
        <LiveFleetMapCard />

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
      </div>
    </ProtectedPage>
  );
}
