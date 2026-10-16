// app/(route-performance)/route-performance/page.tsx

import RouteStat from "./component/RouteStat";
import RouteDonut from "./component/RouteDonut";
import RouteChart from "./component/RouteChart";
import RouteTable from "./component/RouteTable";

export default function RoutePerformancePage() {
  return (
    <div className='space-y-6 text-white'>
      <div className='rounded-xl border border-cyan-500/20 bg-gradient-to-r from-[#0B1220] via-[#101827] to-[#0B1220] p-5 shadow-lg shadow-cyan-950/20'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-[11px] uppercase tracking-[0.24em] text-cyan-400 font-semibold'>
              Route Health Summary
            </p>
            <h2 className='mt-2 text-2xl font-bold text-white'>
              Operational Route Performance
            </h2>
          </div>

          <div className='flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300'>
            <span className='h-2 w-2 rounded-full bg-emerald-400' />
            87% routes within target ETA
          </div>
        </div>
      </div>

      {/* ===== ROUTE STATS (4 BOX ATAS) ===== */}
      <RouteStat />

      {/* ===== CHART (LEFT) & DONUT (RIGHT) ===== */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        <RouteChart />
        <RouteDonut />
      </div>

      {/* ===== TABLE ===== */}
      <RouteTable />
    </div>
  );
}
