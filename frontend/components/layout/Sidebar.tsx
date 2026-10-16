// frontend/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";

const SIDEBAR_TOGGLE_EVENT = "voms:sidebar-toggle";

export function SidebarToggle() {
  return (
    <button
      type='button'
      aria-label='Open navigation menu'
      title='Open navigation menu'
      onClick={() => window.dispatchEvent(new Event(SIDEBAR_TOGGLE_EVENT))}
      className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300'
    >
      <Menu className='h-5 w-5' aria-hidden='true' />
    </button>
  );
}

const menuItems = [
  {
    section: "MAIN MENU",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
            />
          </svg>
        ),
      },
      {
        name: "Drivers",
        href: "/drivers",
        icon: (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
            />
          </svg>
        ),
      },
      {
        name: "Route Performance",
        href: "/route-performance",
        icon: (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
            />
          </svg>
        ),
      },
    ],
  },
  {
    section: "MONITORING",
    items: [
      {
        name: "Alerts",
        href: "/alerts",
        icon: (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
            />
          </svg>
        ),
      },
      {
        name: "Live Map",
        href: "/live-map",
        icon: (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
            />
          </svg>
        ),
      },
      {
        name: "Reports",
        href: "/reports",
        icon: (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        ),
      },
    ],
  },
  {
    section: "SYSTEM CONTROL",
    items: [
      {
        name: "User Access",
        href: "/users",
        icon: (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
            />
          </svg>
        ),
      },
      {
        name: "Master Data",
        href: "/master-data",
        icon: (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6l8-4 8 4-8 4-8-4z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 10l8 4 8-4'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 14l8 4 8-4'
            />
          </svg>
        ),
      },
      {
        name: "Settings",
        href: "/settings",
        icon: (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
        ),
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const canManageSystem = ["ADMIN", "SUPERADMIN"].includes(
    session?.user?.role ?? "",
  );

  useEffect(() => {
    const toggleSidebar = () => setIsOpen((open) => !open);
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, toggleSidebar);
    return () =>
      window.removeEventListener(SIDEBAR_TOGGLE_EVENT, toggleSidebar);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <button
          type='button'
          aria-label='Close navigation menu'
          onClick={() => setIsOpen(false)}
          className='fixed inset-0 z-1000 cursor-default bg-black/60 backdrop-blur-[2px]'
        />
      )}

      <aside
        role='dialog'
        aria-label='Main navigation'
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed inset-y-0 left-0 z-1001 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-cyan-500/20 bg-linear-to-b from-[#0D1117] via-[#0F172A] to-[#020617] shadow-2xl shadow-black/50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"}`}
      >
        <div className='flex h-16 items-center justify-between border-b border-cyan-500/20 px-4'>
          <div className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/40'>
              <svg
                className='h-5 w-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-.293.707L17 21z'
                />
              </svg>
            </div>
            <div>
              <h1 className='text-sm font-bold text-white'>VOMS</h1>
              <p className='text-xs text-gray-500'>OPS Monitor</p>
            </div>
          </div>

          <button
            type='button'
            aria-label='Close navigation menu'
            onClick={() => setIsOpen(false)}
            className='rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white'
          >
            <X className='h-5 w-5' aria-hidden='true' />
          </button>
        </div>

        <nav
          aria-label='Primary navigation'
          className='flex-1 overflow-y-auto px-3 py-4'
        >
          {menuItems.map((section) => {
            if (section.section === "SYSTEM CONTROL" && !canManageSystem) {
              return null;
            }

            return (
              <div key={section.section} className='mb-6'>
                <h2 className='mb-2 px-3 text-xs font-semibold tracking-widest text-gray-400'>
                  {section.section}
                </h2>

                <ul className='space-y-1'>
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                            isActive
                              ? "border border-cyan-400/30 bg-linear-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/10 text-cyan-400 shadow-lg shadow-cyan-500/20"
                              : "text-gray-400 hover:bg-linear-to-r hover:from-cyan-500/10 hover:to-blue-500/10 hover:text-white"
                          }`}
                        >
                          <span className={isActive ? "text-cyan-400" : ""}>
                            {item.icon}
                          </span>
                          <span className='flex-1 text-sm font-medium'>
                            {item.name}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
