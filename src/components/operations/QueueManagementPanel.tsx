'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Scale, 
  History,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { getAllFacilities, getZone } from '@/lib/venue';
import { ConfidenceLevel, Facility, FacilityType } from '@/types/queue';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SortConfig = {
  key: 'name' | 'waitTime' | 'confidence' | 'zone';
  direction: 'ascending' | 'descending';
} | null;

export default function QueueManagementPanel() {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [exporting, setExporting] = useState(false);
  const facilities = getAllFacilities();

  // Mocked prediction data
  const predictions = useMemo(() => {
    return facilities.map(f => ({
      ...f,
      waitTime: Math.floor(Math.random() * 25) + 5,
      confidence: Math.random() > 0.3 ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM,
      historical: Array.from({ length: 10 }, () => Math.floor(Math.random() * 30)),
      sampleCount: Math.floor(Math.random() * 200) + 50
    }));
  }, [facilities]);

  const sortedData = useMemo(() => {
    let sortableData = [...predictions];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        let aVal: any = a[sortConfig.key === 'zone' ? 'zoneId' : sortConfig.key] || 0;
        let bVal: any = b[sortConfig.key === 'zone' ? 'zoneId' : sortConfig.key] || 0;
        
        if (aVal < bVal) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [predictions, sortConfig]);

  const handleSort = (key: any) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert('Queue report exported to CSV (Simulated)');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 reveal overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 bg-secondary rounded-full shadow-[0_0_10px_rgba(255,219,41,0.5)]" />
            <span className="text-[10px] uppercase font-black tracking-[0.4em] text-secondary">Mission Critical</span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
            <Scale className="h-10 w-10 text-secondary" />
            Queue <span className="text-gradient">Control</span>
          </h2>
          <p className="text-[10px] text-stealth-400 font-mono tracking-widest uppercase">
            Facility Throughput & Predictive Analytics Engine
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end px-4 border-r border-white/5">
            <span className="text-[8px] uppercase font-bold text-stealth-500 tracking-[0.2em]">System Status</span>
            <span className="text-xs font-bold text-primary">Operational</span>
          </div>
          
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="group flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-primary/50 transition-all disabled:opacity-50"
          >
            {exporting ? <Clock className="h-4 w-4 animate-spin text-primary" /> : <Download className="h-4 w-4 group-hover:text-primary transition-colors" />}
            {exporting ? 'Processing Data...' : 'Export Intelligence'}
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-2xl border-white/5 overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th 
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors group w-[30%]"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black text-stealth-400 tracking-[0.2em]">
                    Facility
                    {sortConfig?.key === 'name' && (
                       sortConfig.direction === 'ascending' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                    )}
                  </div>
                </th>
                <th className="p-6 w-[15%]">
                  <div className="text-[10px] uppercase font-black text-stealth-400 tracking-[0.2em]">Deployment Zone</div>
                </th>
                <th 
                  className="p-6 w-[15%] cursor-pointer hover:bg-white/5 transition-colors group"
                  onClick={() => handleSort('waitTime')}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black text-stealth-400 tracking-[0.2em]">
                    Est. Latency
                    {sortConfig?.key === 'waitTime' && (
                       sortConfig.direction === 'ascending' ? <ChevronUp className="h-3 w-3 text-secondary" /> : <ChevronDown className="h-3 w-3 text-secondary" />
                    )}
                  </div>
                </th>
                <th className="p-6 w-[20%]">
                  <div className="text-[10px] uppercase font-black text-stealth-400 tracking-[0.2em]">Historical Flux</div>
                </th>
                <th 
                  className="p-6 w-[20%] cursor-pointer hover:bg-white/5 transition-colors group text-right"
                   onClick={() => handleSort('confidence')}
                >
                  <div className="flex items-center justify-end gap-2 text-[10px] uppercase font-black text-stealth-400 tracking-[0.2em]">
                    Confidence
                    {sortConfig?.key === 'confidence' && (
                       sortConfig.direction === 'ascending' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedData.map((f, i) => (
                <motion.tr 
                  key={f.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-white/[0.03] group transition-all duration-300"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-1 h-10 rounded-full",
                        f.type === FacilityType.ENTRY_GATE ? "bg-primary shadow-[0_0_10px_var(--primary-glow)]" : "bg-secondary shadow-[0_0_10px_rgba(255,219,41,0.3)]"
                      )} />
                      <div>
                        <p className="font-black text-lg tracking-tight group-hover:text-white transition-colors">{f.name}</p>
                        <p className="text-[9px] text-stealth-400 uppercase font-black tracking-widest">{f.type === FacilityType.ENTRY_GATE ? 'Protocol: Access' : 'Protocol: Refresh'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-black font-mono text-stealth-300 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded">
                      {getZone(f.zoneId)?.name || f.zoneId}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-baseline gap-1 group-hover:scale-110 transition-transform origin-left">
                      <span className="text-3xl font-black tracking-tighter text-foreground">{f.waitTime}</span>
                      <span className="text-[9px] text-stealth-500 uppercase font-black">MIN</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="h-10 w-full flex items-end gap-[2px]">
                      {f.historical.map((h, j) => (
                        <div 
                          key={j} 
                          className="flex-1 bg-white/5 group-hover:bg-primary/30 transition-all rounded-t-[1px]"
                          style={{ height: `${(h / 30) * 100}%` }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className={cn(
                      "inline-flex flex-col items-end gap-1.5",
                      f.confidence === ConfidenceLevel.HIGH ? "text-primary" : "text-secondary"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest">{f.confidence}</span>
                        {f.confidence === ConfidenceLevel.HIGH ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>
                      <span className="text-[8px] opacity-40 font-mono">POOL: {f.sampleCount} SAMP</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: BarChart3, label: 'PREDICTION ACCURACY', value: '94.2%', color: 'primary' },
          { icon: Clock, label: 'VENUE LATENCY', value: '12.5m', color: 'secondary' },
          { icon: History, label: 'DATA RESERVOIR', value: '1.24M', color: 'alert' }
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-8 rounded-2xl border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
            <div className={cn("flex items-center gap-3 mb-4", `text-${stat.color}`)}>
              <stat.icon className="h-5 w-5" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">{stat.label}</h4>
            </div>
            <p className="text-5xl font-black tracking-tighter group-hover:scale-105 transition-transform origin-left">{stat.value}</p>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 className={cn("h-full", `bg-${stat.color}`)}
                 initial={{ width: 0 }}
                 animate={{ width: '70%' }}
                 transition={{ delay: 0.5, duration: 1.5 }}
               />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
