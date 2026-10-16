// app/(route-performance)/route-performance/component/RouteDonut.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "On Time", value: 65, color: "#22C55E" },
  { name: "At Risk", value: 20, color: "#3B82F6" },
  { name: "Delay", value: 15, color: "#EF4444" },
];

const completionRate = 78;

export default function RouteDonut() {
  return (
    <div className='rounded-xl border border-[#1F2A37] bg-linear-to-b from-[#0F172A] to-[#0B1220] p-5 shadow-lg shadow-slate-900/20'>
      <h3 className='mb-4 text-sm font-semibold text-gray-200'>
        Delivery Status Mix
      </h3>

      <div className='flex items-center gap-6'>
        <div className='relative flex-1 h-60'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
                dataKey='value'
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                stroke='none'
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-3xl font-bold text-white'>
              {completionRate}%
            </span>
            <span className='text-xs text-gray-400'>On Target</span>
          </div>
        </div>

        <div className='flex flex-col justify-center gap-4 pr-2 text-sm'>
          <div className='flex items-center gap-3 text-gray-200'>
            <span className='h-3 w-3 rounded-full bg-[#22C55E]' />
            <span>On Time</span>
          </div>

          <div className='flex items-center gap-3 text-gray-200'>
            <span className='h-3 w-3 rounded-full bg-[#3B82F6]' />
            <span>At Risk</span>
          </div>

          <div className='flex items-center gap-3 text-gray-200'>
            <span className='h-3 w-3 rounded-full bg-[#EF4444]' />
            <span>Delay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
