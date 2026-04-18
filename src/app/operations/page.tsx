'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Scale, 
  Bell, 
  Users, 
  Plus, 
  Shield, 
  Activity, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';

import AlertCenter from '@/components/operations/AlertCenter';
import { StaffAlertPanel } from '@/components/operations/StaffAlertPanel';
import LiveCrowdDashboard from '@/components/operations/LiveCrowdDashboard';
import QueueManagementPanel from '@/components/operations/QueueManagementPanel';
import StaffCoordinationView from '@/components/operations/StaffCoordinationView';
import AlertCreationForm from '@/components/operations/AlertCreationForm';

import { useEventSource } from '@/hooks/useEventSource';
import { DensitySnapshot, ZoneDensity } from '@/types/crowd';
import { getDensityColor } from '@/lib/density';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ViewMode = 'overview' | 'heatmap' | 'queues' | 'alerts' | 'staff';

export default function OperationsDashboard() {
  const [activeView, setActiveView] = useState<ViewMode>('overview');
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
        const zones = [...prev.zones];
        const idx = zones.findIndex(z => z.zoneId === (liveDensity as any).zoneId);
        if (idx !== -1) zones[idx] = liveDensity;
        else zones.push(liveDensity);
        
        return {
          ...prev,
          zones,
          totalOccupancy: zones.reduce((acc, z) => acc + z.occupancy, 0),
          lastUpdated: new Date().toISOString()
        };
      });
    }
  }, [liveDensity]);

  const navItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'heatmap', name: 'Zone Intel', icon: MapIcon },
    { id: 'queues', name: 'Queues', icon: Scale },
    { id: 'alerts', name: 'Incidents', icon: Bell },
    { id: 'staff', name: 'Coordination', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-stealth-900 text-white overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside 
        className={cn(
          "bg-stealth-100/30 border-r border-white/5 transition-all duration-300 flex flex-col z-40 hide-on-mobile",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-4 mb-8">
          <div className="bg-primary/20 p-2 rounded-sm ring-1 ring-primary/30">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-sm font-black uppercase tracking-widest text-white leading-none">
                Sentinel <span className="text-primary block text-[8px] tracking-[0.5em] mt-1">Control Center</span>
              </h1>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewMode)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-sm transition-all group active:scale-[0.98] outline-none touch-target",
                activeView === item.id 
                  ? "bg-primary text-stealth-900 font-bold" 
                  : "text-stealth-400 hover:bg-white/5 hover:text-white"
              )}
              aria-label={`Navigate to ${item.name}`}
            >
              <item.icon className={cn("h-5 w-5", activeView === item.id ? "text-stealth-900" : "group-hover:text-primary")} />
              {isSidebarOpen && <span className="text-xs uppercase tracking-widest">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-3 text-stealth-400 hover:bg-white/5 transition-all"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform duration-300", isSidebarOpen && "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-stealth-100/10 backdrop-blur-xl z-30">
          <div className="flex items-center gap-6">
            <button className="md:hidden text-stealth-300 touch-target">
              <Menu className="h-6 w-6" />
            </button>
            <div className="mt-auto">
              <button className="p-3 text-stealth-300 hover:text-white transition-colors touch-target" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">System Online</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right flex flex-col items-end">
               <span className="text-[8px] font-bold text-stealth-400 uppercase tracking-widest">Global Occupancy</span>
               <span className="text-xs font-mono font-bold text-white">{snapshot?.totalOccupancy.toLocaleString() || '--'}</span>
               <div role="status" aria-live="polite" className="aria-status-region">
                  Current total venue occupancy is {snapshot?.totalOccupancy || 0} attendees.
               </div>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <button 
               onClick={() => setShowAlertModal(true)}
               className="bg-alert text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-alert/90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,77,0,0.3)] touch-target"
            >
              <Plus className="h-3 w-3" />
              Direct Alert
            </button>
          </div>
        </header>

        {/* View Surface */}
        <div className="flex-1 relative overflow-hidden bg-background">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 h-full overflow-y-auto space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="glass-panel p-6 border-white/5 bg-primary/5">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Live Heat Signature</p>
                      <div className="h-48 relative overflow-hidden rounded-sm border border-primary/20 bg-black/40 p-2">
                         {/* Mini heatmap preview */}
                         <div className="absolute inset-0 flex items-center justify-center text-primary/10">
                            <MapIcon className="h-24 w-24" />
                         </div>
                         <div className="relative z-10 grid grid-cols-2 gap-2 h-full">
                            {snapshot?.zones.slice(0, 4).map(z => (
                               <div key={z.zoneId} className="bg-white/5 border border-white/10 p-2 flex flex-col justify-end">
                                  <span className="text-[8px] font-mono text-white/40 uppercase">{z.zoneId}</span>
                                  <span className="text-xs font-bold" style={{ color: getDensityColor(z.level) }}>{z.occupancy}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                   
                   <div className="glass-panel p-6 border-white/5 bg-secondary/5">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Queue Velocity</p>
                      <div className="space-y-4">
                         {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                               <span className="text-xs font-bold uppercase tracking-tight">Gate {i} Alpha</span>
                               <span className="text-sm font-mono text-secondary">~{Math.floor(Math.random() * 20)}m</span>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="glass-panel p-6 border-white/5 bg-alert/5">
                      <p className="text-[10px] font-bold text-alert uppercase tracking-widest mb-2">Mission Log</p>
                      <div className="space-y-3">
                         <div className="flex gap-3 text-[10px] items-start">
                            <span className="text-alert font-mono">08:52</span>
                            <span className="text-white/70">Anomaly detected in Zone-North-1 (Density SPIKE)</span>
                         </div>
                         <div className="flex gap-3 text-[10px] items-start">
                            <span className="text-primary font-mono">08:45</span>
                            <span className="text-white/70">Staff S1 acknowledged Alert ALT-992</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="glass-panel p-6 border-white/5 h-96">
                   <AlertCenter />
                </div>
              </motion.div>
            )}

            {activeView === 'heatmap' && (
              <motion.div 
                key="heatmap"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full"
              >
                <LiveCrowdDashboard />
              </motion.div>
            )}

            {activeView === 'queues' && (
              <motion.div 
                key="queues"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full"
              >
                <QueueManagementPanel />
              </motion.div>
            )}

            {activeView === 'alerts' && (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-8 h-full"
              >
                <StaffAlertPanel />
              </motion.div>
            )}

            {activeView === 'staff' && (
              <motion.div 
                key="staff"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full"
              >
                <StaffCoordinationView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Metrics Bar (Hidden on Mobile) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-stealth-100/80 backdrop-blur-md px-6 py-3 border border-white/10 shadow-2xl z-20 hide-on-mobile">
           <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-stealth-400 uppercase tracking-widest">Network</span>
              <span className="text-[10px] font-mono text-primary flex items-center gap-1">
                 <Activity className="h-3 w-3" /> 42ms
              </span>
           </div>
           <div className="w-[1px] h-4 bg-white/10 self-center" />
           <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-stealth-400 uppercase tracking-widest">Sentinels</span>
              <span className="text-[10px] font-mono text-white">12/12</span>
           </div>
           <div className="w-[1px] h-4 bg-white/10 self-center" />
           <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-stealth-400 uppercase tracking-widest">AI Engine</span>
              <span className="text-[10px] font-mono text-secondary">Operational</span>
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
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
               onClick={() => setShowAlertModal(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative z-10 w-full max-w-lg"
               role="dialog"
               aria-modal="true"
               aria-labelledby="alert-modal-title"
            >
               <AlertCreationForm onClose={() => setShowAlertModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
