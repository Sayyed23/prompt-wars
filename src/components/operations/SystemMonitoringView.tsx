'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Globe, 
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'down';
  responseTimeMs: number;
  uptime: number;
  redis?: { status: string; latencyMs: number };
  database?: { status: string; latencyMs: number };
}

export default function SystemMonitoringView() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [history, setHistory] = useState<number[]>(new Array(40).fill(20));
  const [pulseIndices, setPulseIndices] = useState<number[]>([]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setHealth(data);
        setHistory(prev => [...prev.slice(1), data.responseTimeMs]);
      } catch (err) {
        console.error('Monitoring Fetch Error:', err);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate periodic node pulses
  useEffect(() => {
    const interval = setInterval(() => {
      const count = Math.floor(Math.random() * 3) + 1;
      const newIndices = Array.from({ length: count }, () => Math.floor(Math.random() * 24));
      setPulseIndices(newIndices);
      setTimeout(() => setPulseIndices([]), 1000);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const nodes = useMemo(() => Array.from({ length: 24 }), []);

  return (
    <div className="flex flex-col h-full space-y-8 p-10 overflow-y-auto custom-scrollbar">
      
      {/* Top Level System Heartbeat */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-4 w-4 text-primary" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-stealth-400">Environment</span>
          </div>
          <p className="text-xl font-black uppercase tracking-tighter text-white">ASIA-SOUTH1</p>
          <div className="mt-2 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[8px] font-bold text-primary uppercase">Region Stable</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-secondary/10 rounded-lg">
                <Zap className="h-4 w-4 text-secondary" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-stealth-400">Response</span>
          </div>
          <p className="text-xl font-black font-mono text-white">{health?.responseTimeMs || '---'}ms</p>
          <p className="text-[10px] text-stealth-500 font-bold uppercase tracking-wide mt-2">API Latency Jitter: ±4ms</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-4 w-4 text-primary" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-stealth-400">Cloud SQL</span>
          </div>
          <p className="text-xl font-black uppercase tracking-tighter text-white">
            {health?.database?.status === 'connected' ? 'CONNECTED' : 'STAND-BY'}
          </p>
          <div className="mt-2 text-[10px] text-stealth-500 font-bold uppercase">
             Latency: {health?.database?.latencyMs || '---'}ms
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-secondary/10 rounded-lg">
                <RefreshCw className="h-4 w-4 text-secondary" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-stealth-400">Redis Cache</span>
          </div>
          <p className="text-xl font-black uppercase tracking-tighter text-white">
            {health?.redis?.status === 'connected' ? 'OPTIMIZED' : 'IDLE'}
          </p>
          <div className="mt-2 text-[10px] text-stealth-500 font-bold uppercase">
             TTL_POLICY: SLIDING_5M
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latency Projection Graph */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="h-24 w-24" />
           </div>
           
           <div className="flex justify-between items-center mb-10">
              <div>
                 <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Spectral Latency</h3>
                 <p className="text-xs text-stealth-400 font-medium">Real-time aggregate API response history</p>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[9px] font-bold uppercase opacity-60">Live</span>
                 </div>
              </div>
           </div>

           <div className="h-64 w-full relative">
              <svg className="w-full h-full" preserveAspectRatio="none">
                 <path 
                    d={`M 0 ${64 - (history[0] / 2)} ${history.map((v, i) => `L ${(i / (history.length - 1)) * 1000} ${256 - (v / 500) * 256}`).join(' ')}`}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                    className="transition-all duration-1000"
                 />
                 <path 
                    d={`M 0 ${256} ${history.map((v, i) => `L ${(i / (history.length - 1)) * 1000} ${256 - (v / 500) * 256}`).join(' ')} L 1000 256 Z`}
                    fill="url(#gradient-flow)"
                    className="opacity-10 transition-all duration-1000"
                 />
                 <defs>
                   <linearGradient id="gradient-flow" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="var(--primary)" />
                     <stop offset="100%" stopColor="transparent" />
                   </linearGradient>
                 </defs>
              </svg>
           </div>
           <div className="mt-6 flex justify-between text-[8px] font-mono text-stealth-500 uppercase tracking-widest font-bold">
              <span>T-120S</span>
              <span>T-60S</span>
              <span>NOW</span>
           </div>
        </div>

        {/* Node Status Grid */}
        <div className="glass-panel p-8 rounded-3xl border-white/5">
           <div className="flex flex-col items-center text-center">
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-2">Fleet Node Health</h3>
              <p className="text-xs text-stealth-400 font-medium mb-10">Active Edge Processors</p>
              
              <div className="grid grid-cols-6 gap-3">
                 {nodes.map((_, i) => (
                    <div 
                       key={i}
                       className={cn(
                          "w-8 h-8 rounded-sm border transition-all duration-500 relative group/node",
                          pulseIndices.includes(i) 
                             ? "bg-primary/20 border-primary shadow-[0_0_15px_var(--primary-glow)] scale-110" 
                             : "bg-white/5 border-white/10 hover:border-white/20"
                       )}
                    >
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/node:opacity-100 transition-opacity">
                          <span className="text-[6px] font-mono text-white">{i.toString().padStart(2, '0')}</span>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="mt-12 w-full space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-stealth-500">Core Integrity</span>
                    <span className="text-white">99.8%</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[99.8%]" />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Hardware Detailed Logs */}
      <div className="glass-panel rounded-3xl border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
           <div className="flex items-center gap-3">
              <Cpu className="h-4 w-4 text-stealth-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stealth-300">System Kernel Events</span>
           </div>
           <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all">Export Logs</button>
        </div>
        <div className="p-6 space-y-4 font-mono text-[9px] uppercase tracking-tighter">
           <div className="flex gap-6 items-center group">
              <span className="text-stealth-500">11:02:45.002</span>
              <span className="text-primary font-bold">[INFO]</span>
              <span className="text-white/60">SSE_STREAM_INITIALIZED: /api/realtime/density</span>
              <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary">RECOVERY_SAFE</span>
           </div>
           <div className="flex gap-6 items-center group">
              <span className="text-stealth-500">11:02:42.128</span>
              <span className="text-secondary font-bold">[WARN]</span>
              <span className="text-white/60">JITTER_DETECTED: Node-Alpha-09-S. Latency spike: +12ms</span>
              <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-secondary">AUTO_RESOLVE_ACTIVE</span>
           </div>
           <div className="flex gap-6 items-center group">
              <span className="text-stealth-500">11:02:40.992</span>
              <span className="text-primary font-bold">[INFO]</span>
              <span className="text-white/60">DB_CONNECTION_POOL_REBALANCE: Optimized via Node-Serverless</span>
           </div>
        </div>
      </div>
    </div>
  );
}
