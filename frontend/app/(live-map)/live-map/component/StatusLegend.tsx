// app/(live-map)/live-map/components/StatusLegend.tsx

export default function StatusLegend() {
  return (
    <div className='bg-[#0F172A]/90 border border-white/10 rounded-xl p-3 text-xs space-y-2 shadow-lg shadow-slate-950/30 backdrop-blur-sm'>
      <p className='text-[10px] uppercase tracking-[0.22em] text-slate-400'>
        Fleet Status
      </p>
      <Item color='bg-emerald-400' label='Active / Moving' />
      <Item color='bg-yellow-400' label='On Route / Trip' />
      <Item color='bg-blue-400' label='Idle / Engine On' />
      <Item color='bg-red-400' label='Critical Alert' />
      <Item color='bg-gray-400' label='GPS Offline / Inactive' />
    </div>
  );
}

function Item({ color, label }: { color: string; label: string }) {
  return (
    <div className='flex items-center gap-2 text-gray-300'>
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}
