'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AlertCenter from '@/features/operations/components/AlertCenter';
import AlertCreationForm from '@/features/operations/components/AlertCreationForm';
import { StaffAlertPanel } from '@/features/operations/components/StaffAlertPanel';
import { 
  Shield, 
  ChevronLeft, 
  LayoutDashboard, 
  Plus, 
  Activity, 
  Bell, 
  History,
  Settings,
  X
} from 'lucide-react';

export default function IncidentCommandPage() {
  const [activeTab, setActiveTab] = useState<'stream' | 'staff' | 'history'>('stream');
  const [showAlertModal, setShowAlertModal] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary selection:text-background relative">
      {/* HUD Scanner Animation Background */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-primary animate-[scan_4s_linear_infinite]" />
        <div className="absolute top-0 left-1/2 w-full h-full border-x border-white/5" />
      </div>

      {/* Top Header - Global Ops Bar */}
      <header className="h-20 border-b border-white/5 glass-panel flex items-center justify-between px-8 backdrop-blur-3xl z-40">
        <div className="flex items-center gap-8">
          <Link href="/operations" className="p-2 hover:bg-white/5 rounded-full transition-colors group">
            <ChevronLeft className="h-5 w-5 text-stealth-400 group-hover:text-primary" />
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2.5 rounded-lg ring-1 ring-primary/30 shadow-[0_0_20px_rgba(31,255,160,0.2)]">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">
                Incident <span className="text-primary italic">Command</span>
              </h1>
              <p className="text-[8px] text-stealth-500 font-black tracking-[0.4em] uppercase mt-1">Sector: Omega-9 // Alert Status: DEFCON 4</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="flex bg-white/5 rounded-full p-1 border border-white/10">
            {[
              { id: 'stream', icon: Bell, label: 'Alert Stream' },
              { id: 'staff', icon: Activity, label: 'Staff Dispatch' },
              { id: 'history', icon: History, label: 'Mission Logs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-primary text-background shadow-lg' : 'text-stealth-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </button>
            ))}
          </nav>

          <button 
            onClick={() => setShowAlertModal(true)}
            className="group bg-alert text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,95,31,0.2)] hover:bg-alert/90 transition-all flex items-center gap-3"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Broadcast Incident
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 overflow-hidden p-8 flex gap-8 relative z-10">
        
        {/* Primary Command Feed */}
        <div className="flex-1 flex flex-col min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeTab === 'stream' && <AlertCenter />}
              {activeTab === 'staff' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                   <StaffAlertPanel />
                   <div className="glass-panel p-8 rounded-2xl border-white/5 flex flex-col justify-center items-center text-center space-y-4">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <Activity className="h-8 w-8 text-primary animate-pulse" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Staff Deployment Map</h3>
                      <p className="text-stealth-400 text-xs max-w-xs">Live telemetry for all Ground Units. Select a unit to prioritize dispatch commands.</p>
                      <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">Initialize Sat-View</button>
                   </div>
                </div>
              )}
              {activeTab === 'history' && (
                <div className="glass-panel h-full p-10 flex flex-col items-center justify-center space-y-6 opacity-40 grayscale">
                   <History className="h-16 w-16 text-stealth-300" />
                   <p className="text-xs font-black uppercase tracking-[0.4em]">Mission Logs Encrypted</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tactical Info Panel (Sidebar) */}
        <aside className="w-80 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border-primary/20 bg-primary/5">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Command Intel</p>
            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-stealth-500 uppercase block mb-2">Venue Saturation</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black font-mono">72%</span>
                  <span className="text-[10px] text-alert font-bold uppercase mb-1">↑ 4%</span>
                </div>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-stealth-500 uppercase block mb-2">Active Incidents</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black font-mono text-alert">04</span>
                  <span className="text-[10px] text-stealth-500 font-bold uppercase mb-1">Total Resolve: 128</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-white/5 flex-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Settings className="h-16 w-16" />
            </div>
            <p className="text-[10px] font-black text-stealth-400 uppercase tracking-[0.3em] mb-6">Sector Health</p>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-stealth-400 tracking-widest">Zone-{i} Alpha</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(dot => (
                      <div key={dot} className={`w-1 h-3 rounded-full ${dot <= (5-i) ? 'bg-primary' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Broadcast Modal */}
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
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative z-10 w-full max-w-xl bg-stealth-100/50 p-1 rounded-2xl"
            >
               <div className="absolute -top-4 -right-4 p-2 bg-white/5 rounded-full border border-white/10 hover:text-white cursor-pointer z-50 backdrop-blur-3xl" onClick={() => setShowAlertModal(false)}>
                  <X className="h-4 w-4" />
               </div>
               <AlertCreationForm onClose={() => setShowAlertModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes scan {
          from { top: 0%; opacity: 0.5; }
          to { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
