'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bell,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import AlertCreationForm from '@/features/operations/components/AlertCreationForm';
import AlertCenter from '@/features/operations/components/AlertCenter';
import { useEventSource } from '@/shared/hooks/useEventSource';
import { getDensityColor } from '@/shared/lib/density';
import { DensitySnapshot, ZoneDensity } from '@/shared/types/crowd';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const QUEUE_WAIT_TIMES = [
  { label: 'West Gate', value: 8 },
  { label: 'Food Concourse', value: 12 },
  { label: 'Main Exit', value: 16 },
];

const navItems = [
  { id: 'overview', name: 'Dashboard', icon: LayoutDashboard, href: '/operations' },
  { id: 'incidents', name: 'Incidents', icon: Bell, href: '/operations/incidents' },
  { id: 'staff', name: 'Staff', icon: Users, href: '/operations/staff' },
  { id: 'monitoring', name: 'Monitoring', icon: Activity, href: '/operations/monitoring' },
];

export default function OperationsDashboard() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [snapshot, setSnapshot] = useState<DensitySnapshot | null>(null);
  const { data: liveDensity } = useEventSource<ZoneDensity>('/api/realtime/density');

  useEffect(() => {
    fetch('/api/crowd/density')
      .then((res) => res.json())
      .then((data) => setSnapshot(data))
      .catch((err) => console.error('Failed to load initial density:', err));
  }, []);

  useEffect(() => {
    if (!liveDensity) return;

    setSnapshot((prev) => {
      if (!prev) return prev;

      const zones = {
        ...prev.zones,
        [liveDensity.zoneId]: liveDensity,
      };

      return {
        ...prev,
        zones,
        totalOccupancy: Object.values(zones).reduce((acc, zone) => acc + zone.occupancy, 0),
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [liveDensity]);

  const zones = snapshot ? Object.values(snapshot.zones).slice(0, 4) : [];

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#172033] selection:bg-primary/20 selection:text-foreground lg:flex">
      <aside
        className={cn(
          'hidden border-r border-slate-200 bg-white lg:flex lg:min-h-screen lg:flex-col',
          isSidebarOpen ? 'lg:w-72' : 'lg:w-24'
        )}
      >
        <div className="flex h-24 items-center gap-4 border-b border-slate-100 px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0f172a] text-primary">
            <Shield className="h-6 w-6" />
          </div>
          {isSidebarOpen && (
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-slate-950">Sentinel</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Control Center</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6" aria-label="Operations navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-md px-4 text-sm font-bold transition-colors',
                  isActive
                    ? 'bg-[#0f172a] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                )}
              >
                <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            onClick={() => setIsSidebarOpen((value) => !value)}
            aria-label={isSidebarOpen ? 'Collapse operations sidebar' : 'Expand operations sidebar'}
            className="flex min-h-11 w-full items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            <ChevronRight className={cn('h-5 w-5 transition-transform', isSidebarOpen && 'rotate-180')} />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 lg:hidden" aria-label="Open operations navigation">
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Live Operations
                </div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Venue Command Dashboard</h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2" role="status" aria-live="polite">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global occupancy</p>
                <p className="text-lg font-black text-slate-950">{snapshot?.totalOccupancy.toLocaleString() ?? '0'} pax</p>
                <span className="sr-only">current global occupancy</span>
              </div>
              <button className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50" aria-label="Open operations settings">
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowAlertModal(true)}
                className="flex min-h-11 items-center gap-2 rounded-md bg-alert px-5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-alert/90"
              >
                <Plus className="h-4 w-4" />
                Broadcast Alert
              </button>
            </div>
          </div>
        </header>

        <section className="space-y-6 p-4 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Heat signature</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {zones.length > 0 ? (
                  zones.map((zone) => (
                    <div key={zone.zoneId} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                      <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500">{zone.zoneId}</p>
                      <p className="mt-3 text-2xl font-black" style={{ color: getDensityColor(zone.level) }}>
                        {zone.occupancy}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">pax</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 rounded-md border border-dashed border-slate-200 p-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    Awaiting density feed
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Queue velocity</p>
              <div className="mt-5 space-y-4">
                {QUEUE_WAIT_TIMES.map((queue) => (
                  <div key={queue.label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-secondary" />
                      <span className="text-sm font-bold text-slate-700">{queue.label}</span>
                    </div>
                    <span className="font-mono text-lg font-black text-slate-950">~{queue.value}m</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Mission log</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
                  <span className="font-mono text-xs font-black">08:52</span>
                  <p className="mt-1 font-bold">Density spike detected near North Stand Lower.</p>
                </div>
                <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900">
                  <span className="font-mono text-xs font-black">08:45</span>
                  <p className="mt-1 font-bold">Staff S1 acknowledged crowd-flow adjustment.</p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <section className="min-h-[520px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <AlertCenter />
            </section>

            <aside className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">System status</p>
                <div className="mt-5 space-y-4">
                  {[
                    ['Network latency', '42.8ms', 'text-emerald-600'],
                    ['Active nodes', '12 / 12', 'text-slate-950'],
                    ['Threat level', 'Low', 'text-secondary'],
                  ].map(([label, value, color]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
                      <span className={cn('font-mono text-sm font-black', color)}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-[#0f172a] p-5 text-white shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Operator note</p>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
                  Prioritize staff routing around North Stand until the next density refresh confirms recovery.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {showAlertModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <button className="absolute inset-0 cursor-default" aria-label="Close alert modal" onClick={() => setShowAlertModal(false)} />
          <div className="relative w-full max-w-xl rounded-lg bg-white p-1 shadow-2xl">
            <button
              onClick={() => setShowAlertModal(false)}
              aria-label="Close alert modal"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
            <AlertCreationForm onClose={() => setShowAlertModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
