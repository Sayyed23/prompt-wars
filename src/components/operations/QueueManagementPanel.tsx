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
    <div className="flex flex-col h-full bg-stealth-900 text-white p-6 space-y-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3">
            <Scale className="h-6 w-6 text-secondary" />
            Queue Intelligence
          </h2>
          <p className="text-xs text-stealth-400 font-mono mt-1">
            Facility Wait-Time Predictions & Analytics Console
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
            aria-label="Export queue data to CSV"
          >
            {exporting ? <Clock className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            {exporting ? 'Processing...' : 'Export CSV'}
          </button>
          <div className="h-full w-[1px] bg-white/10" />
          <button className="p-2 bg-white/5 border border-white/10 text-stealth-300">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel border-white/5 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-stealth-100 z-10">
              <tr className="border-b border-white/5">
                <th 
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-stealth-400 tracking-widest">
                    Facility
                    {sortConfig?.key === 'name' ? (
                      sortConfig.direction === 'ascending' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="p-4 w-32">
                  <div className="text-[10px] uppercase font-bold text-stealth-400 tracking-widest">Zone</div>
                </th>
                <th 
                  className="p-4 w-32 cursor-pointer hover:bg-white/5 transition-colors group"
                  onClick={() => handleSort('waitTime')}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-stealth-400 tracking-widest">
                    Est. Wait
                    {sortConfig?.key === 'waitTime' ? (
                      sortConfig.direction === 'ascending' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="p-4 w-48">
                  <div className="text-[10px] uppercase font-bold text-stealth-400 tracking-widest">Historical Trend</div>
                </th>
                <th 
                  className="p-4 w-40 cursor-pointer hover:bg-white/5 transition-colors group"
                   onClick={() => handleSort('confidence')}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-stealth-400 tracking-widest">
                    Confidence
                    {sortConfig?.key === 'confidence' ? (
                      sortConfig.direction === 'ascending' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="p-4 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedData.map((f, i) => (
                <motion.tr 
                  key={f.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.02] group transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-1 h-8 rounded-full",
                        f.type === FacilityType.ENTRY_GATE ? "bg-primary" : "bg-secondary"
                      )} />
                      <div>
                        <p className="font-bold text-sm tracking-tight">{f.name}</p>
                        <p className="text-[10px] text-stealth-400 uppercase font-mono">{f.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-mono text-stealth-300 uppercase">
                      {getZone(f.zoneId)?.name || f.zoneId}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-mono font-bold text-white">{f.waitTime}</span>
                      <span className="text-[10px] text-stealth-400 uppercase">min</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="h-8 w-full flex items-end gap-[1px]">
                      {f.historical.map((h, j) => (
                        <div 
                          key={j} 
                          className="flex-1 bg-white/10 group-hover:bg-primary/20 transition-colors"
                          style={{ height: `${(h / 30) * 100}%` }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[10px] font-bold uppercase tracking-tighter",
                      f.confidence === ConfidenceLevel.HIGH 
                        ? "bg-primary/10 border-primary/30 text-primary" 
                        : "bg-warning/10 border-warning/30 text-warning"
                    )}>
                      {f.confidence === ConfidenceLevel.HIGH ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {f.confidence} 
                      <span className="opacity-50 ml-1">({f.sampleCount})</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-stealth-500 hover:text-white transition-colors" aria-label="View history">
                      <History className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-4 border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-primary mb-3">
            <BarChart3 className="h-4 w-4" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest">Prediction Engine</h4>
          </div>
          <p className="text-2xl font-mono font-bold">94.2%</p>
          <p className="text-[10px] text-stealth-400 uppercase mt-1">Accuracy Margin (last hr)</p>
        </div>
        
        <div className="glass-panel p-4 border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-secondary mb-3">
            <Clock className="h-4 w-4" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest">Ave. System Wait</h4>
          </div>
          <p className="text-2xl font-mono font-bold">12.5m</p>
          <p className="text-[10px] text-stealth-400 uppercase mt-1">Venue-wide Aggregate</p>
        </div>

        <div className="glass-panel p-4 border-white/5 bg-white/[0.02] flex flex-col justify-center">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase mb-2">
            <span className="text-stealth-400">Sample Reservoir</span>
            <span className="text-primary italic">Live Stream</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              animate={{ x: [-100, 400] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              style={{ width: '40px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
