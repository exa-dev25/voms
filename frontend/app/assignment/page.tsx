"use client";

import { useEffect, useState } from "react";

interface Driver {
  id: number;
  name: string;
}

interface Vehicle {
  id: number;
  plate: string;
  type: string | null;
}

interface Warehouse {
  id: number;
  name: string;
  city: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AssignmentPage() {
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setFetchError("Token tidak ditemukan. Silakan login kembali.");
      setLoadingOptions(false);
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [driversRes, vehiclesRes, warehousesRes] = await Promise.all([
          fetch(`${API_URL}/api/drivers`, { headers }),
          fetch(`${API_URL}/api/vehicles`, { headers }),
          fetch(`${API_URL}/api/warehouses`, { headers }),
        ]);

        if (!driversRes.ok || !vehiclesRes.ok || !warehousesRes.ok) {
          throw new Error(
            "Gagal memuat pilihan driver, kendaraan, atau gudang.",
          );
        }

        const [driversData, vehiclesData, warehousesData] = await Promise.all([
          driversRes.json() as Promise<Driver[]>,
          vehiclesRes.json() as Promise<Vehicle[]>,
          warehousesRes.json() as Promise<Warehouse[]>,
        ]);
        setDrivers(driversData);
        setVehicles(vehiclesData);
        setWarehouses(warehousesData);
      } catch (err: unknown) {
        setFetchError(
          err instanceof Error ? err.message : "Gagal mengambil data pilihan.",
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchData();
  }, []);

  const resetForm = () => {
    setDriverId("");
    setVehicleId("");
    setOriginId("");
    setDestinationId("");
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setFetchError("Token tidak ditemukan. Silakan login kembali.");
      return;
    }

    setSaving(true);
    setFetchError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          driverId: Number(driverId),
          vehicleId: Number(vehicleId),
          originId: Number(originId),
          destinationId: Number(destinationId),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan assignment.");
      }

      setSuccessMessage("Assignment berhasil disimpan.");
      resetForm();
    } catch (err: unknown) {
      setFetchError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan assignment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(
    driverId &&
    vehicleId &&
    originId &&
    destinationId &&
    originId !== destinationId,
  );

  return (
    <div className='min-h-screen bg-[#0D1117] text-white p-8'>
      {/* Header */}
      <div className='w-full bg-[#0F172A] border border-cyan-500/40 rounded-xl p-6 mb-8'>
        <h1 className='text-3xl font-bold text-cyan-400'>Assignment</h1>
        <p className='text-gray-400 mt-1'>
          Pilih driver, kendaraan, dan gudang asal serta tujuan.
        </p>
        {fetchError && <p className='text-red-500 mt-2'>{fetchError}</p>}
        {successMessage && (
          <p className='text-green-400 mt-2'>{successMessage}</p>
        )}
      </div>

      {/* Form */}
      <div className='w-full bg-[#0F172A] border border-cyan-500/40 rounded-xl p-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block mb-1 text-sm text-gray-300'>Driver</label>
            <select
              className='w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200'
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              disabled={loadingOptions}
              required
            >
              <option value=''>
                {loadingOptions ? "Memuat..." : "Pilih driver"}
              </option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block mb-1 text-sm text-gray-300'>
              Vehicle / Plat Nomor
            </label>
            <select
              className='w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200'
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={loadingOptions}
              required
            >
              <option value=''>
                {loadingOptions ? "Memuat..." : "Pilih kendaraan"}
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate}
                  {vehicle.type ? ` · ${vehicle.type}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block mb-1 text-sm text-gray-300'>
              Gudang Asal
            </label>
            <select
              className='w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200'
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              disabled={loadingOptions}
              required
            >
              <option value=''>
                {loadingOptions ? "Memuat..." : "Pilih gudang asal"}
              </option>
              {warehouses.map((warehouse) => (
                <option
                  key={warehouse.id}
                  value={warehouse.id}
                  disabled={String(warehouse.id) === destinationId}
                >
                  {warehouse.name} · {warehouse.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block mb-1 text-sm text-gray-300'>
              Gudang Tujuan
            </label>
            <select
              className='w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200'
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              disabled={loadingOptions}
              required
            >
              <option value=''>
                {loadingOptions ? "Memuat..." : "Pilih gudang tujuan"}
              </option>
              {warehouses.map((warehouse) => (
                <option
                  key={warehouse.id}
                  value={warehouse.id}
                  disabled={String(warehouse.id) === originId}
                >
                  {warehouse.name} · {warehouse.city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className='mt-10 flex gap-4'>
          <button
            onClick={handleSave}
            disabled={!canSave || saving || loadingOptions}
            className='px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-semibold'
          >
            {saving ? "Menyimpan..." : "Simpan Assignment"}
          </button>

          <button
            onClick={resetForm}
            className='px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 font-semibold'
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
