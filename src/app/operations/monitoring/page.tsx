'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SystemMonitoringView from '@/features/operations/components/SystemMonitoringView';
import { 
  Activity, 
  ChevronLeft, 
  Server, 
  Terminal, 
  ShieldAlert,
  HardDrive,
  Cpu,
  Unplug
} from 'lucide-react';

export default function SystemMonitoringPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary selection:text-background relative">
      
      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(var(--primary) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} 
      />

      {/* Header - Technical Oversight */}
      <header className="h-20 border-b border-white/5 glass-panel flex items-center justify-between px-8 backdrop-blur-3xl z-40">
        <div className="flex items-center gap-8">
          <Link href="/operations" className="p-2 hover:bg-white/5 rounded-full transition-colors group">
            <ChevronLeft className="h-5 w-5 text-stealth-400 group-hover:text-primary" />
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2.5 rounded-lg ring-1 ring-primary/30 shadow-[0_0_20px_rgba(31,255,160,0.1)]">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">
                System <span className="text-primary italic">Health</span>
              </h1>
              <p className="text-[8px] text-stealth-500 font-black tracking-[0.4em] uppercase mt-1">Infrastructure Monitoring // Nodes: 42/42 Stable</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 px-6 border-l border-white/5">
             <div className="flex flex-col text-right">
                <span className="text-[8px] font-black text-stealth-500 uppercase tracking-widest">Global Resolve</span>
                <span className="text-[10px] font-mono font-bold text-success uppercase">Awaiting_Input</span>
             </div>
             <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                <Terminal className="h-4 w-4 text-stealth-400" />
             </div>
          </div>
          
          <button className="bg-alert/10 hover:bg-alert/20 border border-alert/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 text-alert">
            <ShieldAlert className="h-4 w-4" />
            Maintenance Override
          </button>
        </div>
      </header>

      {/* Main Monitoring Deck */}
      <main className="flex-1 relative z-10 overflow-hidden flex">
        
        {/* Left Stats Bar */}
        <aside className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-10 bg-white/[0.01]">
            {[
              { icon: Cpu, label: 'CPU', val: '12%' },
              { icon: HardDrive, label: 'MEM', val: '4.2G' },
              { icon: Activity, label: 'NET', val: '800k' },
              { icon: Unplug, label: 'PWR', val: 'GRID' }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 group cursor-help">
                 <div className="p-3 rounded-xl bg-white/5 border border-transparent group-hover:border-primary/30 transition-all">
                    <stat.icon className="h-4 w-4 text-stealth-400 group-hover:text-primary transition-colors" />
                 </div>
                 <span className="text-[7px] font-black text-stealth-500 uppercase tracking-widest">{stat.label}</span>
                 <span className="text-[8px] font-mono text-white font-bold">{stat.val}</span>
              </div>
            ))}
        </aside>

        <div className="flex-1 overflow-hidden">
          <SystemMonitoringView />
        </div>

      </main>

      {/* Technical Ticker Footer */}
      <footer className="h-8 border-t border-white/5 flex items-center px-8 justify-between bg-black/40 z-40">
         <div className="flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-2">
               <span className="text-[7px] font-black text-primary uppercase tracking-widest">Krn: 25.1.0</span>
               <div className="w-1 h-1 bg-primary rounded-full" />
            </div>
            <div className="flex items-center gap-4 text-[7px] font-mono text-stealth-500 uppercase tracking-widest whitespace-nowrap animate-[marquee_30s_linear_infinite]">
               <span>SYNC_STATE: VERIFIED</span>
               <span>//</span>
               <span>BUFFER_LOAD: 0.002%</span>
               <span>//</span>
               <span>HEARTBEAT_ACK: TRUE</span>
               <span>//</span>
               <span>THROUGHPUT: 42.1GB/S</span>
               <span>//</span>
               <span>PKT_LOSS: 0.0000%</span>
               <span>//</span>
               <span>REDUNDANCY: ACTIVE</span>
            </div>
         </div>
         <div className="flex items-center gap-4 text-[7px] font-black text-stealth-500 uppercase tracking-widest border-l border-white/10 pl-6">
            <span className="text-white">SYS_UTC: {new Date().toISOString().split('T')[1].split('.')[0]}</span>
         </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
