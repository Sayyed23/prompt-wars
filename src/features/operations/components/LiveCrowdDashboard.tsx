'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Users, 
  Map as MapIcon, 
  AlertTriangle, 
  Maximize2, 
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useEventSource } from '@/shared/hooks/useEventSource';
import { getAllZones } from '@/shared/lib/venue';
import { getDensityColor } from '@/shared/lib/density';
import { DensitySnapshot, ZoneDensity, DensityLevel } from '@/shared/types/crowd';
import { Coordinates } from '@/shared/types/venue';
import { DESIGN_TOKENS } from '@/shared/lib/design-tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LiveCrowdDashboard() {
  const [snapshot, setSnapshot] = useState<DensitySnapshot | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const { data: liveUpdate } = useEventSource<ZoneDensity>('/api/realtime/density');
  const zones = getAllZones();

  useEffect(() => {
    fetch('/api/crowd/density')
      .then(res => res.json())
      .then(data => setSnapshot(data))
      .catch(err => console.error('Failed to load initial density:', err));
  }, []);

  useEffect(() => {
    if (liveUpdate && snapshot) {
      setSnapshot(prev => {
        if (!prev) return null;
        return {
          ...prev,
          zones: {
            ...prev.zones,
            [(liveUpdate as any).zoneId]: liveUpdate
          },
          lastUpdated: new Date().toISOString()
        };
      });
    }
  }, [liveUpdate]);

  const getPointsAttribute = (coords: Coordinates[]) => {
    return coords.map((c) => `${c.x},${c.y}`).join(' ');
  };

  const totalOccupancy = snapshot ? Object.values(snapshot.zones).reduce((acc, z) => acc + z.occupancy, 0) : 0;
  const totalCapacity = zones.reduce((acc, z) => acc + z.capacity, 0);
  const globalSaturation = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-stealth-900/50 overflow-hidden relative">
      {/* Top Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/5 bg-stealth-100/50 backdrop-blur-md relative z-10">
        <div className="p-4 border-r border-white/5">
          <p className="text-[10px] text-stealth-400 font-bold uppercase tracking-widest mb-1">Global Saturation</p>
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-2xl font-mono font-bold",
              globalSaturation > 80 ? "text-critical" : globalSaturation > 50 ? "text-secondary" : "text-primary"
            )}>
              {globalSaturation.toFixed(1)}%
            </span>
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-current" 
                initial={{ width: 0 }}
                animate={{ width: `${globalSaturation}%` }}
                style={{ color: globalSaturation > 80 ? DESIGN_TOKENS.colors.critical : globalSaturation > 50 ? DESIGN_TOKENS.colors.secondary : DESIGN_TOKENS.colors.primary }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-r border-white/5">
          <p className="text-[10px] text-stealth-400 font-bold uppercase tracking-widest mb-1">Total Live Attendees</p>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-2xl font-mono font-bold text-white tracking-tight">
              {totalOccupancy.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-4 border-r border-white/5">
          <p className="text-[10px] text-stealth-400 font-bold uppercase tracking-widest mb-1">Sentinel Throughput</p>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-secondary" />
            <span className="text-2xl font-mono font-bold text-secondary tracking-tight">
              1.2k <span className="text-xs">msg/s</span>
            </span>
          </div>
        </div>

        <div className="p-4 bg-primary/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest mb-1 italic relative z-10">Last Update</p>
          <div className="flex items-center gap-2 relative z-10">
            <Clock className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-lg font-mono font-bold text-primary">
              {snapshot ? new Date(snapshot.lastUpdated || snapshot.timestamp).toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Map Area */}
        <div className="flex-1 relative bg-black/40 p-4 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} 
          />
          
          <div className="relative w-full h-full max-w-5xl max-height-full">
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full drop-shadow-[0_0_30px_rgba(32,232,209,0.1)]"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {zones.map((zone) => {
                const density = snapshot?.zones[zone.id];
                const color = density ? getDensityColor(density.level) : DESIGN_TOKENS.colors.stealth[200];
                const isCritical = density?.level === DensityLevel.CRITICAL;
                const isSelected = selectedZone === zone.id;

                return (
                  <g 
                    key={zone.id} 
                    className="cursor-crosshair group outline-none"
                    onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                  >
                    <motion.polygon
                      points={getPointsAttribute(zone.coordinates)}
                      animate={{ 
                        fill: color,
                        stroke: isSelected ? DESIGN_TOKENS.colors.primary : 'rgba(255,255,255,0.1)',
                        strokeWidth: isSelected ? 0.8 : 0.2,
                        opacity: selectedZone && !isSelected ? 0.3 : 1
                      }}
                      whileHover={{ scale: 1.005, stroke: 'rgba(255,255,255,0.4)', strokeWidth: 0.5 }}
                      className="transition-all duration-300"
                    />

                    {isCritical && (
                      <motion.polygon
                        points={getPointsAttribute(zone.coordinates)}
                        animate={{ 
                          opacity: [0, 1, 0],
                          strokeWidth: [0.2, 1.5, 0.2]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        fill="none"
                        stroke={DESIGN_TOKENS.colors.critical}
                        className="pointer-events-none"
                        style={{ filter: 'url(#glow)' }}
                      />
                    )}

                    <text
                      x={(zone.coordinates[0].x + zone.coordinates[2].x) / 2}
                      y={(zone.coordinates[0].y + zone.coordinates[2].y) / 2}
                      textAnchor="middle"
                      className="fill-white/40 font-mono text-[2.5px] pointer-events-none uppercase italic"
                    >
                      {zone.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Float Legend */}
            <div className="absolute bottom-4 left-4 glass-panel p-3 border-white/5 flex flex-col gap-2">
              <p className="text-[10px] font-bold text-stealth-400 uppercase mb-1">Density Legend</p>
              {Object.values(DensityLevel).map(level => (
                <div key={level} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getDensityColor(level) }} />
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-tighter">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Zone List - Hidden on desktop small, collapsible logic can be added or just ensure space */}
        <div className={cn(
          "w-80 border-l border-white/5 bg-stealth-100/40 backdrop-blur-xl flex flex-col transition-all duration-500",
          "hidden xl:flex" // Only show side-by-side on large screens
        )}>
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-3 bg-primary" />
              Zone Intelligence
            </h3>
            <span className="text-[10px] font-mono text-stealth-400">{zones.length} Total</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {zones.sort((a, b) => {
              const dA = snapshot?.zones[a.id]?.occupancy || 0;
              const dB = snapshot?.zones[b.id]?.occupancy || 0;
              return dB - dA;
            }).map(zone => {
              const density = snapshot?.zones[zone.id];
              const isSelected = selectedZone === zone.id;
              const saturation = density ? (density.occupancy / zone.capacity) * 100 : 0;

              return (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                  className={cn(
                    "w-full p-3 rounded-sm flex flex-col gap-2 transition-all text-left",
                    isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase">{zone.name}</span>
                    <div 
                      className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
                      style={{ backgroundColor: getDensityColor(density?.level || DensityLevel.LOW) }}
                    />
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-mono font-bold">{density?.occupancy || 0}</span>
                      <span className="text-[10px] text-stealth-400">/ {zone.capacity}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-mono font-bold",
                      saturation > 80 ? "text-critical" : "text-stealth-400"
                    )}>
                      {saturation.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-current" 
                      animate={{ width: `${saturation}%` }}
                      style={{ color: getDensityColor(density?.level || DensityLevel.LOW) }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Drill-down Detail Modal Overlay - Refactored for responsiveness */}
          <AnimatePresence>
            {selectedZone && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute bottom-0 inset-x-0 xl:right-80 glass-panel m-4 p-4 md:p-6 border-white/10 z-40 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-4 bg-primary" />
                      <h2 className="text-2xl font-bold uppercase tracking-tighter">
                        {zones.find(z => z.id === selectedZone)?.name}
                      </h2>
                    </div>
                    <p className="text-xs text-stealth-400 font-mono italic">Zone ID: {selectedZone}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedZone(null)}
                    className="p-2 hover:bg-white/10 rounded-full text-stealth-400 transition-colors"
                  >
                    <Maximize2 className="h-4 w-4 rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Entry Delta</span>
                    </div>
                    <p className="text-3xl font-mono font-bold">+12 <span className="text-xs text-stealth-400">/min</span></p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-2 text-secondary mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Wait Estimate</span>
                    </div>
                    <p className="text-3xl font-mono font-bold">~14 <span className="text-xs text-stealth-400">mins</span></p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-2 text-alert mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Status Severity</span>
                    </div>
                    <p className="text-xl font-bold uppercase" style={{ color: getDensityColor(snapshot?.zones[selectedZone]?.level || DensityLevel.LOW) }}>
                      {snapshot?.zones[selectedZone]?.level || 'STABLE'}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    <button className="flex items-center justify-between p-3 bg-primary text-stealth-900 font-bold text-xs uppercase group">
                      Dispatch Staff
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="flex items-center justify-between p-3 border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition-colors">
                      Broadcast Alert
                      <Activity className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
