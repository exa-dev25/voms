"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Truck,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { handleUnauthorized } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const PAGE_SIZE = 20;

interface AlertRecord {
  id: number;
  timestamp: string;
  createdAt: string;
  payload: unknown;
  vehicle: { id: number; plate: string };
}

interface AlertsResponse {
  alerts: AlertRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: { total: number; today: number; vehiclesAffected: number };
}

type Severity = "critical" | "high" | "warning" | "info";
type SeverityFilter = "all" | Severity;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstText(...values: unknown[]): string | undefined {
  const value = values.find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  );
  return typeof value === "string" ? value.trim() : undefined;
}

function describeAlert(alert: AlertRecord) {
  const payload = asObject(alert.payload);
  const detail = asObject(payload.alert);
  const title =
    firstText(
      detail.name,
      detail.type,
      payload.alertName,
      payload.alert_name,
      payload.alert_type,
      payload.alarmName,
      payload.alertType,
      payload.event,
      payload.type,
    ) || "Vehicle alert";
  const description =
    firstText(
      detail.description,
      detail.message,
      payload.description,
      payload.details,
      payload.message,
    ) || "No additional details provided.";
  const severityValue = firstText(
    detail.severity,
    payload.severity,
    payload.priority,
    payload.level,
  )?.toLowerCase();
  const signal = `${title} ${description}`.toLowerCase();

  let severity: Severity = "info";
  if (severityValue && /critical|emergency|urgent|severe/.test(severityValue)) {
    severity = "critical";
  } else if (severityValue && /high/.test(severityValue)) {
    severity = "high";
  } else if (severityValue && /warning|medium|moderate/.test(severityValue)) {
    severity = "warning";
  } else if (/sos|collision|crash|tamper|theft|emergency/.test(signal)) {
    severity = "critical";
  } else if (/high|overspeed|offline|low battery|power|geofence/.test(signal)) {
    severity = "high";
  } else if (/warning|temperature|speed|voltage|door/.test(signal)) {
    severity = "warning";
  }

  const gps = asObject(payload.gps);
  const location = asObject(payload.location);
  const latitude =
    typeof gps.latitude === "number"
      ? gps.latitude
      : typeof payload.latitude === "number"
        ? payload.latitude
        : typeof location.latitude === "number"
          ? location.latitude
          : null;
  const longitude =
    typeof gps.longitude === "number"
      ? gps.longitude
      : typeof payload.longitude === "number"
        ? payload.longitude
        : typeof location.longitude === "number"
          ? location.longitude
          : null;

  return { title, description, severity, latitude, longitude };
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

const severityStyles: Record<Severity, string> = {
  critical: "border-red-400/25 bg-red-400/10 text-red-300",
  high: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  warning: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  info: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
};

const severityDotStyles: Record<Severity, string> = {
  critical: "bg-red-400 shadow-[0_0_9px_rgba(248,113,113,0.7)]",
  high: "bg-orange-400 shadow-[0_0_9px_rgba(251,146,60,0.65)]",
  warning: "bg-amber-300 shadow-[0_0_9px_rgba(252,211,77,0.6)]",
  info: "bg-cyan-300 shadow-[0_0_9px_rgba(103,232,249,0.55)]",
};

const severityFilters: { id: SeverityFilter; label: string }[] = [
  { id: "all", label: "All events" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Info" },
];

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    today: 0,
    vehiclesAffected: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;
    const controller = new AbortController();
    let active = true;

    const loadAlerts = async () => {
      if (hasLoaded.current) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        const response = await fetch(`${API_URL}/api/alerts?${params}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${session.accessToken}` },
          signal: controller.signal,
        });
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!response.ok)
          throw new Error(`Alert request failed (${response.status})`);

        const result = (await response.json()) as AlertsResponse;
        if (!active) return;
        setAlerts(Array.isArray(result.alerts) ? result.alerts : []);
        setSummary(
          result.summary ?? { total: 0, today: 0, vehiclesAffected: 0 },
        );
        setPagination(result.pagination ?? { page, total: 0, totalPages: 0 });
        setError("");
      } catch (loadError) {
        if (active && !controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load alerts.",
          );
        }
      } finally {
        if (active) {
          hasLoaded.current = true;
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => {
      active = false;
      clearInterval(interval);
      controller.abort();
    };
  }, [page, refreshKey, session?.accessToken, status]);

  const visibleAlerts = alerts.filter((alert) => {
    const details = describeAlert(alert);
    const matchesSeverity =
      severityFilter === "all" || details.severity === severityFilter;
    const searchable =
      `${alert.vehicle?.plate ?? ""} ${details.title} ${details.description} ${details.severity}`.toLowerCase();
    return matchesSeverity && searchable.includes(search.trim().toLowerCase());
  });

  const metrics = [
    {
      label: "Alert events",
      value: summary.total,
      note: "Recorded telemetry",
      icon: Bell,
      tone: "text-cyan-300",
    },
    {
      label: "Received today",
      value: summary.today,
      note: "Since local midnight",
      icon: Clock3,
      tone: "text-amber-200",
    },
    {
      label: "Vehicles affected",
      value: summary.vehiclesAffected,
      note: "Unique reporting units",
      icon: Truck,
      tone: "text-emerald-300",
    },
  ];

  return (
    <ProtectedPage requiredRole='VIEWER'>
      <main className='min-h-full space-y-6 bg-[#0a0e1a] p-5 text-white sm:p-7'>
        <header className='flex flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <p className='font-mono text-[10px] uppercase text-cyan-300/80'>
              Monitoring / Event stream
            </p>
            <div className='mt-2 flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-sm border border-red-400/25 bg-red-400/10 text-red-300'>
                <ShieldAlert className='h-5 w-5' aria-hidden='true' />
              </div>
              <div>
                <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
                  Alert center
                </h1>
                <p className='mt-1 text-sm text-slate-400'>
                  Vehicle events received by the VOMS telemetry service.
                </p>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <span className='flex items-center gap-2 rounded-sm border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300'>
              <span className='h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]' />
              Updating every 30 sec
            </span>
            <button
              type='button'
              onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
              title='Refresh alerts'
              aria-label='Refresh alerts'
              className='inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300'
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                aria-hidden='true'
              />
            </button>
          </div>
        </header>

        <section
          aria-label='Alert summary'
          className='grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0'
        >
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className='flex items-center gap-4 px-4 py-4 sm:px-6'
            >
              <metric.icon
                className={`h-5 w-5 ${metric.tone}`}
                aria-hidden='true'
              />
              <div className='min-w-0'>
                <p className='text-xs text-slate-400'>{metric.label}</p>
                <p className='mt-0.5 font-mono text-2xl font-semibold tabular-nums text-white'>
                  {loading ? "—" : metric.value.toLocaleString("en-US")}
                </p>
              </div>
              <span className='ml-auto text-right text-[10px] text-slate-500'>
                {metric.note}
              </span>
            </article>
          ))}
        </section>

        <section className='space-y-4'>
          <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
            <div className='flex max-w-full gap-1 overflow-x-auto border-b border-white/10'>
              {severityFilters.map((filter) => (
                <button
                  key={filter.id}
                  type='button'
                  onClick={() => setSeverityFilter(filter.id)}
                  aria-pressed={severityFilter === filter.id}
                  className={`shrink-0 border-b-2 px-3 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${severityFilter === filter.id ? "border-cyan-300 text-cyan-200" : "border-transparent text-slate-400 hover:text-white"}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label className='relative block w-full xl:max-w-xs'>
              <Search
                className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500'
                aria-hidden='true'
              />
              <input
                type='search'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='Search events or vehicles'
                aria-label='Search alerts'
                className='h-10 w-full rounded-sm border border-white/10 bg-[#080d17] pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-1 focus:ring-cyan-300/30'
              />
            </label>
          </div>

          <div className='overflow-hidden border-y border-white/10 bg-[#0d131e]/80'>
            <div className='flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5'>
              <div className='flex items-center gap-2'>
                <AlertTriangle
                  className='h-4 w-4 text-amber-200'
                  aria-hidden='true'
                />
                <h2 className='text-sm font-semibold text-slate-100'>
                  Recent events
                </h2>
                <span className='font-mono text-xs text-slate-500'>
                  {visibleAlerts.length.toString().padStart(2, "0")}
                </span>
              </div>
              <p className='text-xs text-slate-500'>
                {pagination.total
                  ? `${(pagination.page - 1) * PAGE_SIZE + 1}–${Math.min(pagination.page * PAGE_SIZE, pagination.total)} of ${pagination.total}`
                  : "No records"}
              </p>
            </div>

            {error ? (
              <div className='flex flex-col items-center gap-3 px-6 py-14 text-center'>
                <AlertTriangle
                  className='h-7 w-7 text-red-300'
                  aria-hidden='true'
                />
                <p className='text-sm text-red-200'>{error}</p>
                <button
                  type='button'
                  onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
                  className='text-xs text-cyan-200 underline decoration-cyan-400/40 underline-offset-4'
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className='space-y-px'>
                {[0, 1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className='h-20.5 animate-pulse border-b border-white/5 bg-white/2'
                  />
                ))}
              </div>
            ) : visibleAlerts.length === 0 ? (
              <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/5 text-emerald-300'>
                  <Zap className='h-5 w-5' aria-hidden='true' />
                </div>
                <div>
                  <h3 className='text-sm font-medium text-slate-200'>
                    {alerts.length
                      ? "No matching events"
                      : "No alert events recorded"}
                  </h3>
                  <p className='mt-1 text-xs text-slate-500'>
                    {alerts.length
                      ? "Try another search or severity filter."
                      : "New vehicle alert telemetry will appear here."}
                  </p>
                </div>
              </div>
            ) : (
              <div className='divide-y divide-white/6'>
                {visibleAlerts.map((alert) => {
                  const details = describeAlert(alert);
                  const severityIcon =
                    details.severity === "critical"
                      ? ShieldAlert
                      : AlertTriangle;
                  const SeverityIcon = severityIcon;
                  const gps = asObject(asObject(alert.payload).gps);
                  const latitude =
                    details.latitude ??
                    (typeof gps.lat === "number" ? gps.lat : null);
                  const longitude =
                    details.longitude ??
                    (typeof gps.lng === "number" ? gps.lng : null);

                  return (
                    <details key={alert.id} className='group'>
                      <summary className='grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 transition hover:bg-white/2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 sm:grid-cols-[minmax(0,1.5fr)_minmax(130px,0.6fr)_minmax(165px,0.7fr)_28px] sm:px-5'>
                        <div className='flex min-w-0 items-start gap-3'>
                          <span
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border ${severityStyles[details.severity]}`}
                          >
                            <SeverityIcon
                              className='h-4 w-4'
                              aria-hidden='true'
                            />
                          </span>
                          <div className='min-w-0'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <p className='truncate text-sm font-medium text-slate-100'>
                                {details.title}
                              </p>
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${severityStyles[details.severity]}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${severityDotStyles[details.severity]}`}
                                />
                                {details.severity}
                              </span>
                            </div>
                            <p className='mt-1 line-clamp-1 text-xs text-slate-400'>
                              {details.description}
                            </p>
                            <p className='mt-2 flex items-center gap-1.5 text-xs text-slate-500 sm:hidden'>
                              <Truck
                                className='h-3.5 w-3.5'
                                aria-hidden='true'
                              />
                              {alert.vehicle?.plate || "Unknown vehicle"}
                              <span className='px-0.5 text-slate-700'>·</span>
                              {formatTimestamp(alert.timestamp)}
                            </p>
                          </div>
                        </div>

                        <span className='hidden items-center gap-2 text-xs text-slate-300 sm:flex'>
                          <Truck
                            className='h-3.5 w-3.5 text-slate-500'
                            aria-hidden='true'
                          />
                          {alert.vehicle?.plate || "Unknown vehicle"}
                        </span>
                        <span className='hidden items-center gap-2 text-xs text-slate-400 sm:flex'>
                          <Clock3
                            className='h-3.5 w-3.5 text-slate-500'
                            aria-hidden='true'
                          />
                          {formatTimestamp(alert.timestamp)}
                        </span>
                        <span className='hidden text-right text-xs text-slate-600 group-open:rotate-90 sm:block'>
                          ›
                        </span>
                      </summary>

                      <div className='grid gap-4 border-t border-white/6 bg-black/20 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.5fr)] sm:px-16'>
                        <div>
                          <p className='text-[10px] font-semibold uppercase text-slate-500'>
                            Event details
                          </p>
                          <p className='mt-2 text-sm leading-6 text-slate-300'>
                            {details.description}
                          </p>
                          <p className='mt-3 font-mono text-[10px] text-slate-600'>
                            Event ID {alert.id} ·{" "}
                            {formatTimestamp(alert.timestamp)}
                          </p>
                        </div>
                        <div className='flex items-start justify-between gap-4 border-t border-white/6 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0'>
                          <div>
                            <p className='text-[10px] font-semibold uppercase text-slate-500'>
                              Vehicle location
                            </p>
                            <p className='mt-2 flex items-center gap-1.5 text-xs text-slate-300'>
                              <MapPin
                                className='h-3.5 w-3.5 text-cyan-300'
                                aria-hidden='true'
                              />
                              {latitude !== null && longitude !== null
                                ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                                : "No coordinates in event"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            )}

            <footer className='flex items-center justify-between border-t border-white/10 px-4 py-3 sm:px-5'>
              <p className='text-xs text-slate-500'>
                Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
              </p>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() =>
                    setPage((currentPage) => Math.max(1, currentPage - 1))
                  }
                  disabled={page <= 1 || loading}
                  aria-label='Previous alerts page'
                  className='inline-flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-35'
                >
                  <ArrowLeft className='h-4 w-4' aria-hidden='true' />
                </button>
                <button
                  type='button'
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(pagination.totalPages, currentPage + 1),
                    )
                  }
                  disabled={page >= pagination.totalPages || loading}
                  aria-label='Next alerts page'
                  className='inline-flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-35'
                >
                  <ArrowRight className='h-4 w-4' aria-hidden='true' />
                </button>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </ProtectedPage>
  );
}
