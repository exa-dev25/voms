"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, X } from "lucide-react";
import StatsCards from "./components/StatsCard";
import TopDriversBarChart from "./components/TopDriversBarChart";
import PerformanceDonutChart from "./components/PeformanceDonutChart";
import FilterSection from "./components/FilterSection";
import DriverActivityTable from "./components/DriverActivityTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DriversPage() {
  const { data: session } = useSession();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddDriver = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.accessToken) {
      setFormError("Sesi login tidak ditemukan. Silakan login kembali.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const response = await fetch(`${API_URL}/api/drivers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ name: driverName.trim() }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Gagal menambahkan driver.");
      }

      setDriverName("");
      setIsAddOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Gagal menambahkan driver.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-gradient-to-b from-[#0f1419] via-[#161B22] to-[#0f1419]'>
      {/* Header */}
      <div className='relative mb-4 sm:mb-6'>
        <div>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2 mb-2'>
            <h1 className='text-xl sm:text-2xl font-bold text-white'>
              Driver Activity & Insights
            </h1>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
              <span className='text-xs font-semibold text-green-400'>Live</span>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
            <p className='text-gray-400 text-sm'>
              Source: Real-time Telemetry • Last updated: Just now
            </p>
            <div className='flex items-center gap-2 text-xs'>
              <div className='flex items-center gap-1'>
                <div className='relative'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <div className='absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping'></div>
                </div>
                <span className='text-gray-400'>Real-time Sync</span>
              </div>
            </div>
          </div>
        </div>
        <button
          type='button'
          onClick={() => {
            setFormError(null);
            setIsAddOpen(true);
          }}
          className='mt-4 inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 sm:absolute sm:right-0 sm:top-0 sm:mt-0'
        >
          <Plus className='h-4 w-4' aria-hidden='true' />
          Tambah Driver
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
        <div className='lg:col-span-2'>
          <TopDriversBarChart />
        </div>
        <div className='lg:col-span-1'>
          <PerformanceDonutChart />
        </div>
      </div>

      {/* Filter Section - DI BAWAH semua konten */}
      <FilterSection />

      {/* Detailed Driver Activity Table */}
      <DriverActivityTable refreshKey={refreshKey} />

      {isAddOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'
          onClick={() => setIsAddOpen(false)}
        >
          <section
            role='dialog'
            aria-modal='true'
            aria-labelledby='add-driver-title'
            className='w-full max-w-md rounded-lg border border-white/10 bg-[#111820] p-5 shadow-2xl'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='mb-5 flex items-start justify-between gap-4'>
              <div>
                <h2
                  id='add-driver-title'
                  className='text-lg font-semibold text-white'
                >
                  Tambah Driver
                </h2>
                <p className='mt-1 text-sm text-gray-400'>
                  Masukkan nama driver baru.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setIsAddOpen(false)}
                aria-label='Tutup form tambah driver'
                className='rounded-md p-2 text-gray-400 transition hover:bg-white/10 hover:text-white'
              >
                <X className='h-4 w-4' aria-hidden='true' />
              </button>
            </div>
            <form onSubmit={handleAddDriver} className='space-y-4'>
              <label
                className='block text-sm text-gray-300'
                htmlFor='driver-name'
              >
                Nama driver
              </label>
              <input
                id='driver-name'
                autoFocus
                required
                value={driverName}
                onChange={(event) => setDriverName(event.target.value)}
                className='-mt-2 w-full rounded-md border border-white/15 bg-[#0a0e12] px-3 py-2.5 text-white outline-none transition focus:border-cyan-400'
                placeholder='Contoh: Budi Santoso'
              />
              {formError && (
                <p role='alert' className='text-sm text-red-300'>
                  {formError}
                </p>
              )}
              <div className='flex justify-end gap-2 pt-1'>
                <button
                  type='button'
                  onClick={() => setIsAddOpen(false)}
                  className='rounded-md border border-white/15 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5'
                >
                  Batal
                </button>
                <button
                  type='submit'
                  disabled={saving || !driverName.trim()}
                  className='rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#071116] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {saving ? "Menyimpan..." : "Simpan Driver"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Bottom subtle gradient */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/5 via-transparent to-transparent pointer-events-none'></div>
    </div>
  );
}
