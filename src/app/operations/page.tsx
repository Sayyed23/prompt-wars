'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bell,
  ChevronRight,
  Clock,
  Cpu,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

import AlertCreationForm from '@/features/operations/components/AlertCreationForm';
import AlertCenter from '@/features/operations/components/AlertCenter';
import { useEventSource } from '@/shared/hooks/useEventSource';
import { getDensityColor } from '@/shared/lib/density';
import { DensitySnapshot, ZoneDensity } from '@/shared/types/crowd';


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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-foreground lg:flex">
      {/* Sentinel Sidebar */}
      <aside
        className={cn(
          'hidden border-r border-white/5 bg-stealth-100/50 backdrop-blur-3xl lg:flex lg:min-h-screen lg:flex-col transition-all duration-500',
          isSidebarOpen ? 'lg:w-72' : 'lg:w-24'
        )}
      >
        <div className="flex h-24 items-center gap-4 border-b border-white/5 px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-[0_0_20px_rgba(20,255,216,0.2)]">
            <Shield className="h-6 w-6" />
          </div>
          {isSidebarOpen && (
            <div className="reveal">
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">Sentinel</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Cluster Alpha</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-2 px-4 py-8" aria-label="Operations navigation">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-md px-4 text-[10px] font-black uppercase tracking-widest transition-all duration-300 group reveal',
                  `stagger-${(idx % 4) + 1}`,
                  isActive
                    ? 'bg-primary text-background shadow-[0_0_20px_rgba(20,255,216,0.3)]'
                    : 'text-stealth-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-background' : 'text-primary')} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setIsSidebarOpen((value) => !value)}
            aria-label={isSidebarOpen ? 'Collapse operations sidebar' : 'Expand operations sidebar'}
            className="flex min-h-11 w-full items-center justify-center rounded-sm border border-white/5 bg-white/5 text-stealth-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className={cn('h-5 w-5 transition-transform duration-500', isSidebarOpen && 'rotate-180')} />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 relative">
        {/* Animated Background Pulse */}
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[120px] pointer-events-none -z-10" />

        <header className="sticky top-0 z-30 border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 py-6 md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <button className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-stealth-400 lg:hidden" aria-label="Open operations navigation">
                <Menu className="h-6 w-6" />
              </button>
              <div className="reveal">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Live Command Link Established
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-tighter text-white md:text-4xl">Venue Command <span className="text-stealth-400 italic font-medium">v.2.4</span></h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 reveal-scale">
              <div className="glass-panel px-6 py-3 rounded-sm border-primary/20" role="status" aria-live="polite">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stealth-400">Net Occupancy</p>
                <p className="text-xl font-black text-white">{snapshot?.totalOccupancy.toLocaleString() ?? '0'} <span className="text-[10px] text-primary/60">PAX</span></p>
                <span className="sr-only">current global occupancy</span>
              </div>
              
              <div className="flex gap-2">
                <button className="flex h-12 w-12 items-center justify-center rounded-sm border border-white/5 bg-white/5 text-stealth-400 transition-all hover:bg-white/10 hover:text-white" aria-label="Open operations settings">
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="flex min-h-12 items-center gap-3 rounded-sm bg-alert px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_25px_rgba(255,95,31,0.3)] transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Broadcast Alert
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-6 p-4 md:p-8">
          {/* Main Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <article className="glass-panel p-6 rounded-sm min-h-[220px] transition-all hover:border-white/10 group">
              <div className="flex justify-between items-start mb-8">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stealth-400">Neural Heat Signature</p>
                <Activity className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {zones.length > 0 ? (
                  zones.map((zone, idx) => (
                    <div key={zone.zoneId} className={cn("rounded-sm border border-white/5 bg-white/5 p-4 reveal", `stagger-${idx + 1}`)}>
                      <p className="truncate text-[8px] font-black uppercase tracking-widest text-stealth-500">{zone.zoneId}</p>
                      <div className="flex items-baseline gap-1 mt-2">
                        <p className="text-2xl font-black font-mono" style={{ color: getDensityColor(zone.level) }}>
                          {zone.occupancy}
                        </p>
                        <span className="text-[8px] font-bold text-stealth-600 uppercase">Pax</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 mt-3 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-1000" 
                          style={{ 
                            width: `${zone.densityPercentage}%`,
                            backgroundColor: getDensityColor(zone.level)
                          }} 
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 rounded-sm border border-dashed border-white/10 p-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-stealth-600 backdrop-blur-md">
                    Initializing Density Mesh...
                  </div>
                )}
              </div>
            </article>

            <article className="glass-panel p-6 rounded-sm min-h-[220px] transition-all hover:border-white/10 group">
              <div className="flex justify-between items-start mb-8">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stealth-400">Queue Velocity Pulse</p>
                <Clock className="h-4 w-4 text-secondary/40 group-hover:text-secondary transition-colors" />
              </div>
              <div className="space-y-6">
                {QUEUE_WAIT_TIMES.map((queue, idx) => (
                  <div key={queue.label} className={cn("flex items-center justify-between border-b border-white/5 pb-4 last:border-0 reveal", `stagger-${idx + 1}`)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-sm bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-tighter text-white">{queue.label}</span>
                        <p className="text-[9px] text-stealth-500 uppercase font-black">Gate Alpha-5</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xl font-black text-secondary">~{queue.value}M</span>
                      <p className="text-[8px] text-stealth-600 uppercase font-bold tracking-widest">Wait Time</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="glass-panel p-6 rounded-sm min-h-[220px] transition-all hover:border-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stealth-400 mb-8">Global Mission Log</p>
              <div className="space-y-4">
                <div className="rounded-sm bg-alert/10 border-l-2 border-alert p-4 text-xs reveal stagger-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[9px] font-black text-alert">08:52:14</span>
                    <span className="text-[8px] font-black uppercase text-alert/60">Anomalous Spike</span>
                  </div>
                  <p className="font-bold text-white/90">Critical density shift at North Stand Lower. Protocol 4 initiated.</p>
                </div>
                <div className="rounded-sm bg-primary/10 border-l-2 border-primary p-4 text-xs reveal stagger-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[9px] font-black text-primary">08:45:02</span>
                    <span className="text-[8px] font-black uppercase text-primary/60">Unit Acknowledged</span>
                  </div>
                  <p className="font-bold text-white/90">Staff Unit S-1 reached Gate 5. Flow redistribution active.</p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="min-h-[620px] relative">
              <AlertCenter />
            </section>

            <aside className="space-y-6">
              <div className="glass-panel p-6 rounded-sm transition-all hover:border-white/10 group">
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-stealth-400 mb-6">Quantum State</p>
                <div className="space-y-5">
                  {[
                    ['System Latency', '0.04ms', 'text-primary'],
                    ['Sync Nodes', '12 / 12', 'text-white'],
                    ['Threat Level', 'ALPHA-LOW', 'text-secondary'],
                  ].map(([label, value, color], idx) => (
                    <div key={label} className={cn("flex items-center justify-between border-b border-white/5 pb-3 last:border-0 reveal", `stagger-${idx + 1}`)}>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stealth-500">{label}</span>
                      <span className={cn('font-mono text-sm font-black', color)}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="glass-panel p-6 rounded-sm bg-primary/5 border-primary/20 relative overflow-hidden group hover:border-primary/40 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                  <Cpu className="h-16 w-16 text-primary" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-6">Commander's Directive</p>
                <p className="text-xs font-black leading-7 text-white/80 uppercase tracking-wider relative z-10">
                  Prioritize staff routing around North Stand. Avoid congestion bottle-necks during next heat-signature refresh. Valid for next 15 cycles.
                </p>
                <div className="mt-8 flex items-center gap-2">
                  <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-primary shadow-[0_0_10px_rgba(20,255,216,0.5)] animate-pulse" />
                  </div>
                  <span className="text-[8px] font-mono font-black text-primary/60">66%</span>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {showAlertModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-xl"
          >
            <button
              onClick={() => setShowAlertModal(false)}
              aria-label="Close alert modal"
              className="absolute -top-14 right-0 flex h-10 w-10 items-center justify-center rounded-sm bg-white/5 text-stealth-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="quantum-card-glow rounded-sm">
              <AlertCreationForm onClose={() => setShowAlertModal(false)} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
