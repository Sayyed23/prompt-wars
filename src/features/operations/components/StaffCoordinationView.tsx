'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Navigation, 
  Radio, 
  Shield, 
  MessageSquare,
  Search,
  MoreVertical,
  Activity
} from 'lucide-react';
import { getAllZones } from '@/shared/lib/venue';
import { DESIGN_TOKENS } from '@/shared/lib/design-tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'offline';
  coords: [number, number];
  zoneId: string;
  battery: number;
}

export default function StaffCoordinationView() {
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 'S1', name: 'J. Miller', role: 'Security', status: 'available', coords: [20, 25], zoneId: 'zone-north-1', battery: 84 },
    { id: 'S2', name: 'A. Chen', role: 'Medic', status: 'busy', coords: [70, 30], zoneId: 'zone-south-1', battery: 42 },
    { id: 'S3', name: 'R. Kowalski', role: 'Staff', status: 'available', coords: [40, 65], zoneId: 'zone-food-1', battery: 91 },
    { id: 'S4', name: 'K. Sato', role: 'Security', status: 'available', coords: [25, 90], zoneId: 'zone-entry-1', battery: 67 },
  ]);

  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const zones = getAllZones();

  // Simulate subtle staff movement
  useEffect(() => {
    const interval = setInterval(() => {
      setStaff(prev => prev.map(s => ({
        ...s,
        coords: [
          s.coords[0] + (Math.random() - 0.5) * 1.5,
          s.coords[1] + (Math.random() - 0.5) * 1.5,
        ] as [number, number]
      })));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getPointsAttribute = (coords: number[][]) => {
    return coords.map(([x, y]) => `${x},${y}`).join(' ');
  };

  return (
    <div className="flex flex-1 h-full bg-stealth-900 overflow-hidden">
      {/* Search & Staff List Sidebar */}
      <div className="w-80 border-r border-white/5 bg-stealth-100/10 flex flex-col h-full">
        <div className="p-4 border-b border-white/5">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stealth-400" />
            <input 
              type="text" 
              placeholder="Search Staff IDs..." 
              className="w-full bg-white/5 border border-white/10 p-2 pl-9 text-[10px] uppercase font-bold tracking-widest outline-none focus:border-primary transition-all text-white"
            />
          </div>
          <div className="flex gap-1">
            {['All', 'Active', 'Busy'].map(f => (
              <button key={f} className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5">
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {staff.map(member => (
            <button
              key={member.id}
              onClick={() => setSelectedStaff(member.id)}
              className={cn(
                "w-full p-3 flex items-start gap-4 transition-all group",
                selectedStaff === member.id ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-white/5 border-l-2 border-transparent"
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-stealth-200 border border-white/10 flex items-center justify-center text-xs font-bold font-mono">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-3 h-3 border-2 border-stealth-900 rounded-full",
                  member.status === 'available' ? "bg-success" : member.status === 'busy' ? "bg-warning" : "bg-stealth-400"
                )} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold uppercase text-white tracking-tight">{member.name}</h4>
                  <span className="text-[8px] font-mono text-stealth-400">ID: {member.id}</span>
                </div>
                <p className="text-[8px] text-stealth-500 uppercase font-bold tracking-widest mt-1">{member.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-stealth-300" style={{ width: `${member.battery}%` }} />
                  </div>
                  <span className="text-[8px] font-mono text-stealth-400">{member.battery}%</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 bg-white/5">
          <button className="w-full py-3 bg-primary text-stealth-900 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(32,232,209,0.2)]">
            <Radio className="h-3 w-3" />
            Broadcast to All
          </button>
        </div>
      </div>

      {/* Map Content Area */}
      <div className="flex-1 relative bg-black/40 p-8 flex items-center justify-center">
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stealth-100/40 backdrop-blur-md border border-white/5 shadow-xl">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Live Tracking Active</span>
          </div>
        </div>

        <div className="relative w-full h-full max-w-4xl">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Zones Grid */}
            {zones.map(zone => (
              <polygon
                key={zone.id}
                points={getPointsAttribute(zone.coordinates)}
                className="fill-stealth-100/10 stroke-white/5 stroke-[0.2]"
              />
            ))}

            {/* Staff Markers */}
            {staff.map(member => (
              <motion.g
                key={member.id}
                initial={false}
                animate={{ x: member.coords[0], y: member.coords[1] }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                className="cursor-pointer"
                onClick={() => setSelectedStaff(member.id)}
              >
                <circle r="2.5" className="fill-primary/20 animate-pulse" />
                <circle r="1.2" className="fill-primary stroke-white/20 stroke-[0.1]" />
                <AnimatePresence>
                  {(selectedStaff === member.id || true) && (
                    <motion.g
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="pointer-events-none"
                    >
                      <rect x="2" y="-4" width="20" height="5" className="fill-black/60 shadow-lg" rx="0.5" />
                      <text x="3" y="-2" className="fill-white font-bold text-[1.8px] uppercase tracking-tighter">
                        {member.name}
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
              </motion.g>
            ))}
          </svg>
        </div>

        {/* Selected Staff Float Card */}
        <AnimatePresence>
          {selectedStaff && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="absolute bottom-8 right-8 w-72 glass-panel p-6 border-white/10 z-20 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary text-stealth-900 flex items-center justify-center font-bold text-lg font-mono">
                    {staff.find(s => s.id === selectedStaff)?.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white tracking-tight leading-none uppercase">
                      {staff.find(s => s.id === selectedStaff)?.name}
                    </h3>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
                      {staff.find(s => s.id === selectedStaff)?.role}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedStaff(null)} className="text-stealth-400">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-white/5 border border-white/5 rounded-sm flex items-center justify-between">
                  <span className="text-[10px] text-stealth-400 font-bold uppercase tracking-widest">Current Sector</span>
                  <span className="text-xs font-mono font-bold text-white uppercase">
                    {staff.find(s => s.id === selectedStaff)?.zoneId}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    Ping
                  </button>
                  <button className="flex-1 py-3 bg-secondary text-stealth-900 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <Navigation className="h-3 w-3" />
                    Reroute
                  </button>
                </div>

                <div className="flex items-center gap-3 p-3 border border-white/5 rounded-sm">
                  <Activity className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="flex justify-between text-[8px] font-bold uppercase mb-1">
                      <span className="text-stealth-400">Assignment Status</span>
                      <span className="text-primary">92% Compliance</span>
                    </div>
                    <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '92%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
