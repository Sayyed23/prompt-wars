'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Bell, 
  Users, 
  Plus, 
  Settings,
  Activity,
  Menu,
  X,
  Activity as HistoryIcon,
  ChevronRight,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import AlertCenter from '@/features/operations/components/AlertCenter';
import { StaffAlertPanel } from '@/features/operations/components/StaffAlertPanel';
import { useEventSource } from '@/shared/hooks/useEventSource';
import { DensitySnapshot, ZoneDensity } from '@/shared/types/crowd';
import { getDensityColor } from '@/shared/lib/density';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import AlertCreationForm from '@/features/operations/components/AlertCreationForm';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function OperationsDashboard() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [snapshot, setSnapshot] = useState<DensitySnapshot | null>(null);
  
  const { data: liveDensity } = useEventSource<ZoneDensity>('/api/realtime/density');

  useEffect(() => {
    fetch('/api/crowd/density')
      .then(res => res.json())
      .then(data => setSnapshot(data))
      .catch(err => console.error('Failed to load initial density:', err));
  }, []);

  useEffect(() => {
    if (liveDensity && snapshot) {
      setSnapshot(prev => {
        if (!prev) return null;
        
        const newZones = {
          ...prev.zones,
          [liveDensity.zoneId]: liveDensity
        };
        
        return {
          ...prev,
          zones: newZones,
          totalOccupancy: Object.values(newZones).reduce((acc, z) => acc + z.occupancy, 0),
          lastUpdated: new Date().toISOString()
        };
      });
    }
  }, [liveDensity, snapshot]);

  const navItems = [
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard, href: '/operations' },
    { id: 'incidents', name: 'Incidents', icon: Bell, href: '/operations/incidents' },
    { id: 'staff', name: 'Staff', icon: Users, href: '/operations/staff' },
    { id: 'monitoring', name: 'Monitoring', icon: HistoryIcon, href: '/operations/monitoring' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary selection:text-background">
      
      {/* Sidebar Navigation - Glassmorphic Sentinel Style */}
      <aside 
        className={cn(
          "bg-stealth-100/10 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 flex flex-col z-40 relative group/sidebar",
          isSidebarOpen ? "w-72" : "w-24"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50 pointer-events-none" />
        
        <div className="p-8 flex items-center gap-4 mb-10 relative">
          <div className="bg-primary/10 p-3 rounded-xl ring-1 ring-primary/30 shadow-[0_0_20px_rgba(31,255,160,0.2)] group-hover/sidebar:rotate-12 transition-transform duration-500">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-lg font-black uppercase tracking-tighter text-white leading-none">
                Sentinel <span className="text-primary block text-[9px] font-black tracking-[0.5em] mt-2 opacity-70">Control-v.2</span>
              </h1>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-3 relative">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl transition-all relative group overflow-hidden",
                  isActive 
                    ? "bg-primary shadow-[0_0_30px_var(--primary-glow)] text-background" 
                    : "text-stealth-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 relative z-10", isActive ? "text-background" : "group-hover:text-primary transition-colors")} />
                {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">{item.name}</span>}
                {isActive && (
                  <motion.div layoutId="nav-active" className="absolute inset-0 bg-primary" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 relative">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-4 bg-white/5 rounded-xl text-stealth-400 hover:text-primary hover:bg-white/10 transition-all border border-white/5"
          >
            <ChevronRight className={cn("h-5 w-5 transition-transform duration-500", isSidebarOpen && "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(31,255,160,0.05),transparent)] pointer-events-none" />
        
        {/* Top Header - Modern Command Bar */}
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 glass-panel backdrop-blur-2xl z-30">
          <div className="flex items-center gap-8">
            <button className="md:hidden text-stealth-300">
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary-glow)]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Quantum Link: Stable</p>
                </div>
                <p className="text-[8px] text-stealth-500 uppercase font-bold tracking-widest mt-1">Uptime: 99.98% / Cluster: 04</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-8 px-8 border-x border-white/5">
              <div className="text-right flex flex-col items-end">
                 <span className="text-[8px] font-black text-stealth-500 uppercase tracking-widest mb-1">Global Load</span>
                 <span className="text-2xl font-black font-mono text-white tracking-tighter">
                   {snapshot?.totalOccupancy.toLocaleString() || '---'}
                 </span>
              </div>
              <div className="text-right flex flex-col items-end">
                 <span className="text-[8px] font-black text-stealth-500 uppercase tracking-widest mb-1">Threat Level</span>
                 <span className="text-xs font-black text-secondary uppercase animate-pulse">Low Alpha</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-3 bg-white/5 rounded-full text-stealth-400 hover:text-white border border-white/10 transition-all">
                <Settings className="h-5 w-5" />
              </button>
              <button 
                 onClick={() => setShowAlertModal(true)}
                 className="group bg-alert text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-alert/90 transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(255,77,0,0.2)] active:scale-95"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                Broadcast Alert
              </button>
            </div>
          </div>
        </header>

        {/* View Surface - Fluid Transitions */}
        <div className="flex-1 relative overflow-hidden bg-background/50 backdrop-blur-sm">
          <AnimatePresence mode="wait">
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-10 h-full overflow-y-auto space-y-10 custom-scrollbar"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="glass-panel p-8 rounded-2xl border-white/5 bg-primary/5 group hover:bg-primary/10 transition-all duration-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <MapIcon className="h-20 w-20" />
                      </div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Neural Heat Signature</p>
                      <div className="h-48 relative overflow-hidden rounded-xl border border-white/5 bg-black/40 backdrop-blur-md p-4">
                         <div className="grid grid-cols-2 gap-3 h-full">
                            {snapshot && Object.values(snapshot.zones).slice(0, 4).map(z => (
                               <div key={z.zoneId} className="bg-white/[0.02] border border-white/5 p-3 flex flex-col justify-between rounded-lg">
                                  <span className="text-[9px] font-black font-mono text-stealth-500 uppercase">{z.zoneId}</span>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black tracking-tighter" style={{ color: getDensityColor(z.level) }}>{z.occupancy}</span>
                                    <span className="text-[8px] opacity-20 font-bold uppercase">Pax</span>
                                  </div>
                                </div>
                            ))}
                         </div>
                      </div>
                   </div>
                   
                   <div className="glass-panel p-8 rounded-2xl border-white/5 bg-secondary/5 group hover:bg-secondary/10 transition-all duration-500">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-6">Queue Velocity Pulse</p>
                      <div className="space-y-4">
                         {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0">
                               <div className="flex items-center gap-3">
                                  <Activity className="h-4 w-4 text-secondary/40" />
                                  <span className="text-xs font-black uppercase tracking-widest text-stealth-300">Sector-Gate {i} Alpha</span>
                               </div>
                               <span className="text-lg font-black font-mono text-secondary">~{Math.floor(Math.random() * 20)}m</span>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="glass-panel p-8 rounded-2xl border-white/5 bg-alert/5 group hover:bg-alert/10 transition-all duration-500">
                      <p className="text-[10px] font-black text-alert uppercase tracking-[0.3em] mb-6">Blackbox Mission Log</p>
                      <div className="space-y-4">
                         <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-alert font-black font-mono text-[10px]">08:52</span>
                            <span className="text-[10px] text-white/70 font-bold uppercase tracking-tight leading-relaxed">Anomaly detected in Zone-North-1 (Density SPIKE)</span>
                         </div>
                         <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-primary font-black font-mono text-[10px]">08:45</span>
                            <span className="text-[10px] text-white/70 font-bold uppercase tracking-tight leading-relaxed">Staff S1 acknowledged Alert ALT-992</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="glass-panel p-8 rounded-2xl border-white/5 min-h-[500px] shadow-2xl">
                   <AlertCenter />
                </div>
              </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Metrics Bar - Premium Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8 bg-white/5 backdrop-blur-3xl px-10 py-5 rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 group hover:border-primary/20 transition-all duration-500">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-stealth-500 uppercase tracking-widest">Network Latency</span>
                <span className="text-xs font-black font-mono text-white">42.8ms</span>
              </div>
           </div>
           <div className="w-[1px] h-8 bg-white/10" />
           <div className="flex items-center gap-4">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Users className="h-4 w-4 text-secondary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-stealth-500 uppercase tracking-widest">Active nodes</span>
                <span className="text-xs font-black font-mono text-white">12 / 12 Online</span>
              </div>
           </div>
           <div className="w-[1px] h-8 bg-white/10" />
           <div className="flex items-center gap-4">
              <div className="p-2 bg-alert/10 rounded-lg">
                <Shield className="h-4 w-4 text-alert" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-stealth-500 uppercase tracking-widest">Sentinel Core</span>
                <span className="text-xs font-black font-mono text-primary">v2.4.9 ACTIVE</span>
              </div>
           </div>
        </div>
      </main>

      {/* Alert Creation Modal */}
      <AnimatePresence>
        {showAlertModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/90 backdrop-blur-xl"
               onClick={() => setShowAlertModal(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative z-10 w-full max-w-xl"
            >
               <AlertCreationForm onClose={() => setShowAlertModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
