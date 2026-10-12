"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Driver {
  id: number;
  name: string;
  createdAt: string;
}

interface DriverActivityTableProps {
  refreshKey: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DriverActivityTable({
  refreshKey,
}: DriverActivityTableProps) {
  const { data: session, status } = useSession();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.accessToken) {
      setError("Sesi login tidak ditemukan. Silakan login kembali.");
      setLoading(false);
      return;
    }

    const fetchDrivers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/drivers`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });

        if (!response.ok) throw new Error("Gagal memuat data driver.");
        setDrivers((await response.json()) as Driver[]);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Gagal memuat data driver.",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchDrivers();
  }, [refreshKey, session?.accessToken, status]);

  return (
    <section className='rounded-xl border border-white/10 bg-[#111820] p-5 sm:p-6'>
      <div className='mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end'>
        <div>
          <h2 className='text-lg font-semibold text-white'>
            Detailed Driver Activity
          </h2>
          <p className='mt-1 text-sm text-gray-400'>
            Driver terdaftar: {drivers.length}
          </p>
        </div>
      </div>

      {error && (
        <p className='mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300'>
          {error}
        </p>
      )}

      <div className='overflow-x-auto rounded-lg border border-white/10'>
        <table className='w-full min-w-[560px] text-left'>
          <thead className='border-b border-white/10 bg-white/[0.03]'>
            <tr>
              <th className='px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                Driver Name
              </th>
              <th className='px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                Driver ID
              </th>
              <th className='px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                Registered
              </th>
              <th className='px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                Status
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/5'>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className='px-4 py-10 text-center text-sm text-gray-400'
                >
                  Memuat driver...
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className='px-4 py-10 text-center text-sm text-gray-400'
                >
                  Belum ada driver terdaftar.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr
                  key={driver.id}
                  className='transition hover:bg-white/[0.03]'
                >
                  <td className='px-4 py-4 font-medium text-white'>
                    <span className='mr-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-semibold'>
                      {driver.name.charAt(0).toUpperCase()}
                    </span>
                    {driver.name}
                  </td>
                  <td className='px-4 py-4 font-mono text-sm text-gray-300'>
                    DRV-{String(driver.id).padStart(3, "0")}
                  </td>
                  <td className='px-4 py-4 text-sm text-gray-300'>
                    {new Date(driver.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className='px-4 py-4'>
                    <span className='inline-flex items-center gap-2 text-sm text-emerald-300'>
                      <span className='h-2 w-2 rounded-full bg-emerald-400' />
                      Terdaftar
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
