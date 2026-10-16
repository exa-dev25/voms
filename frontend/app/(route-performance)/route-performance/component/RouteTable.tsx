"use client";

const routes = [
  {
    code: "RT-1001",
    name: "Jakarta - Bandung",
    planned: "4h 30m",
    actual: "4h 20m",
    deviation: "-10m",
    status: "On Time",
    tone: "emerald",
  },
  {
    code: "RT-1042",
    name: "Bandung - Jogja",
    planned: "3h 00m",
    actual: "3h 05m",
    deviation: "+5m",
    status: "At Risk",
    tone: "amber",
  },
  {
    code: "RT-2099",
    name: "Jakarta - Semarang",
    planned: "6h 00m",
    actual: "6h 32m",
    deviation: "+32m",
    status: "Delayed",
    tone: "red",
  },
];

export default function RouteTable() {
  return (
    <div className='rounded-xl border border-[#1F2A37] bg-gradient-to-b from-[#0F172A] to-[#0B1220] p-5 shadow-lg shadow-slate-900/20'>
      <div className='mb-4'>
        <h3 className='text-sm font-semibold text-gray-200'>
          Route Performance Details
        </h3>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b border-[#1F2A37] text-left text-gray-400'>
              <th className='py-3'>Route Code</th>
              <th className='py-3'>Origin - Destination</th>
              <th className='py-3'>Planned ETA</th>
              <th className='py-3'>Actual ETA</th>
              <th className='py-3'>Deviation</th>
              <th className='py-3 text-right'>Status</th>
            </tr>
          </thead>

          <tbody>
            {routes.map((route, index) => {
              const statusClasses =
                route.tone === "emerald"
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                  : route.tone === "amber"
                    ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                    : "border-red-500/30 bg-red-500/15 text-red-400";

              return (
                <tr
                  key={index}
                  className='border-b border-[#1F2A37] last:border-none hover:bg-white/5 transition'
                >
                  <td className='py-3 font-medium text-gray-200'>
                    {route.code}
                  </td>
                  <td className='py-3 text-gray-300'>{route.name}</td>
                  <td className='py-3 text-gray-300'>{route.planned}</td>
                  <td className='py-3 text-gray-300'>{route.actual}</td>
                  <td className='py-3 text-gray-300'>{route.deviation}</td>
                  <td className='py-3 text-right'>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusClasses}`}
                    >
                      {route.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
