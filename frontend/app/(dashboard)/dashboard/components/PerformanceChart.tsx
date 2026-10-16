"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { handleUnauthorized } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PerformanceItem {
  name: string;
  onTime: number;
  delay: number;
}

interface PerformanceResponse {
  data: PerformanceItem[];
  average: {
    onTime: number;
    delay: number;
  };
}

export default function PerformanceChart() {
  const { data: session, status } = useSession();

  const [data, setData] = useState<PerformanceItem[]>([]);
  const [avgOnTime, setAvgOnTime] = useState<number>(0);
  const [avgDelay, setAvgDelay] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.accessToken) return;
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL is undefined");
      return;
    }

    const fetchPerformance = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${API_URL}/api/dashboard/performance?range=7d`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          },
        );

        if (res.status === 401) {
          handleUnauthorized();
          setData([]);
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Failed to fetch performance data (${res.status}): ${text}`,
          );
        }

        const json: PerformanceResponse = await res.json();

        setData(json.data || []);
        setAvgOnTime(json.average?.onTime ?? 0);
        setAvgDelay(json.average?.delay ?? 0);
      } catch (err) {
        console.error("Performance chart fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [status, session?.accessToken]);

  if (loading) {
    return (
      <div className='h-[360px] bg-[#0D1117] border border-white/10 rounded-xl animate-pulse' />
    );
  }

  return (
    <div className='relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 rounded-xl p-6 overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-2xl'>
      <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500' />

      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-white font-semibold text-lg'>Performance Trends</h3>

        <div className='flex items-center gap-4 text-xs'>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50' />
            <span className='text-gray-400'>On Time</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50' />
            <span className='text-gray-400'>Delayed</span>
          </div>
        </div>
      </div>

      <div className='h-[240px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#1F2A37' />

            <XAxis
              dataKey='name'
              stroke='#6B7280'
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
            />

            <YAxis stroke='#6B7280' tick={{ fill: "#9CA3AF", fontSize: 12 }} />

            <Tooltip
              contentStyle={{
                backgroundColor: "#161B22",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />

            <Line
              type='monotone'
              dataKey='onTime'
              stroke='#22c55e'
              strokeWidth={3}
              dot={{ fill: "#22c55e", r: 4 }}
              activeDot={{ r: 6 }}
            />

            <Line
              type='monotone'
              dataKey='delay'
              stroke='#ef4444'
              strokeWidth={3}
              dot={{ fill: "#ef4444", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className='grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10'>
        <div className='text-center'>
          <p className='text-xs text-gray-400 mb-1'>Avg On-Time</p>
          <p className='text-2xl font-bold text-green-400'>{avgOnTime}</p>
        </div>

        <div className='text-center'>
          <p className='text-xs text-gray-400 mb-1'>Avg Delay</p>
          <p className='text-2xl font-bold text-red-400'>{avgDelay}</p>
        </div>
      </div>
    </div>
  );
}
