'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StaffCoordinationView from '@/components/operations/StaffCoordinationView';
import { 
  Users, 
  ChevronLeft, 
  Map as MapIcon, 
  Radio, 
  ShieldCheck, 
  Cpu,
  SignalHigh,
  Unplug
} from 'lucide-react';

export default function StaffCoordinationPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary selection:text-background relative">
      
      {/* Dynamic Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary animate-[scan-staff_8s_linear_infinite]" />
      </div>

      {/* Control Header */}
      <header className="h-20 border-b border-white/5 glass-panel flex items-center justify-between px-8 backdrop-blur-3xl z-40">
        <div className="flex items-center gap-8">
          <Link href="/operations" className="p-2 hover:bg-white/5 rounded-full transition-colors group">
            <ChevronLeft className="h-5 w-5 text-stealth-400 group-hover:text-primary" />
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="bg-secondary/20 p-2.5 rounded-lg ring-1 ring-secondary/30 shadow-[0_0_20px_rgba(255,219,41,0.1)]">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">
                Staff <span className="text-secondary italic">Coordination</span>
              </h1>
              <p className="text-[8px] text-stealth-500 font-black tracking-[0.4em] uppercase mt-1">Ground Unit Sync // Total Units: 12 Active</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-8 px-8 border-x border-white/5">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-primary">
                <SignalHigh className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Low Latency Pulse</span>
              </div>
              <p className="text-[10px] font-mono font-bold text-white mt-1">14ms</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-secondary flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Encr. Channel</span>
              </div>
              <p className="text-[10px] font-mono font-bold text-white mt-1">AES-256</p>
            </div>
          </div>

          <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3">
            <Radio className="h-4 w-4" />
            Establish Fleet Link
          </button>
        </div>
      </header>

      {/* Main Tactical Map View */}
      <main className="flex-1 relative z-10 overflow-hidden">
        <StaffCoordinationView />
        
        {/* Floating Command Overlay */}
        <div className="absolute top-10 right-10 w-80 space-y-6 pointer-events-none">
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="glass-panel p-6 border-white/10 pointer-events-auto bg-black/60 shadow-2xl rounded-2xl"
           >
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-4">Deployment Overview</p>
              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] font-bold text-stealth-400 uppercase tracking-widest">Security Alpha</span>
                    <span className="text-[10px] font-black text-primary uppercase">Zone N1</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] font-bold text-stealth-400 uppercase tracking-widest">Medical S1</span>
                    <span className="text-[10px] font-black text-alert uppercase">Zone S2</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] font-bold text-stealth-400 uppercase tracking-widest">Logistics X4</span>
                    <span className="text-[10px] font-black text-white uppercase font-mono">STAND-BY</span>
                 </div>
              </div>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="glass-panel p-6 border-white/10 pointer-events-auto bg-black/40 shadow-xl rounded-2xl"
           >
              <div className="flex items-center gap-3 mb-4">
                 <Cpu className="h-4 w-4 text-primary" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-stealth-300">Unit Telemetry</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                 {[40, 70, 45, 90, 65, 30, 85, 55, 45, 60, 75, 50].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/20 hover:bg-primary transition-colors cursor-help group relative" style={{ height: `${h}%` }}>
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-primary text-background text-[6px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                         {h}%
                       </div>
                    </div>
                 ))}
              </div>
              <p className="text-[8px] text-stealth-500 font-bold uppercase tracking-widest mt-4 text-center">Spectral Coverage Distro</p>
           </motion.div>
        </div>

        {/* Tactical Footers - Asset Tracking */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 glass-panel border-white/5 bg-black/80 rounded-full flex gap-10 items-center">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-stealth-300">GPS_SYNC_HEALTH: 100%</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-3">
               <Unplug className="h-3 w-3 text-secondary" />
               <span className="text-[9px] font-black uppercase tracking-widest text-stealth-300">ENCRYPT_KEY: ROT_SEC_992</span>
            </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes scan-staff {
          from { top: -10%; opacity: 0; }
          to { top: 110%; opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
