// frontend/app/(dashboard)/layout.tsx
"use client";

import { Sidebar, SidebarToggle } from "@/components/layout/Sidebar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex h-screen overflow-hidden bg-[#0a0e1a]'>
      {/* Sidebar - Fixed & Scrollable */}
      <Sidebar />

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        <header className='flex h-16 shrink-0 items-center gap-4 border-b border-cyan-500/20 bg-[#0f1419] px-6'>
          <SidebarToggle />
          <div>
            <p className='text-sm font-semibold text-white'>System Control</p>
            <p className='text-xs text-gray-400'>
              User access and configuration
            </p>
          </div>
        </header>
        {/* Page Content - Scrollable, NO PADDING HERE */}
        <main className='flex-1 overflow-y-auto'>{children}</main>
      </div>
    </div>
  );
}
