'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Map as MapIcon, RefreshCw, AlertTriangle } from 'lucide-react';
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

export default function CrowdHeatmap() {
  const [snapshot, setSnapshot] = useState<DensitySnapshot | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const { data: liveUpdate, status } = useEventSource<ZoneDensity>('/api/realtime/density');
  const zones = getAllZones();

  // Initial load
  useEffect(() => {
    fetch('/api/crowd/density')
      .then(res => res.json())
      .then(data => setSnapshot(data))
      .catch(err => console.error('Failed to load initial density:', err));
  }, []);

  // Live updates
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

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-4 md:p-10 reveal">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 bg-primary rounded-full" />
            <span className="text-[10px] uppercase font-bold text-primary tracking-[0.4em]">Operations Feed</span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Spatial <span className="text-gradient">Intelligence</span></h2>
          <div className="flex items-center gap-2 text-xs font-bold text-stealth-400">
            {status === 'connected' ? (
              <div className="flex items-center gap-2 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[9px] uppercase tracking-widest">Live: Synced</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20 text-secondary">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span className="text-[9px] uppercase tracking-widest">Reconnecting...</span>
              </div>
            )}
            <span className="opacity-40 font-mono tracking-widest uppercase text-[9px]">Node-v1.4.2</span>
          </div>
        </div>

        <div className="glass-panel p-3 rounded-lg border-white/5 backdrop-blur-xl flex gap-6">
          {Object.values(DensityLevel).map((level) => (
            <div key={level} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-1 rounded-full opacity-40"
                style={{ backgroundColor: getDensityColor(level) }}
              />
              <span className="text-[8px] uppercase font-black tracking-widest text-stealth-400">{level}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative aspect-[21/9] lg:aspect-[3/1] bg-stealth-100/30 rounded-2xl glass-panel kinetic-border overflow-hidden p-8 group">
        {/* Dynamic Background Noise */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--stealth-400) 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }} />
        
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Live Venue Crowd Density Heatmap"
        >
          <defs>
            <filter id="hyper-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {zones.map(zone => {
              const density = snapshot?.zones[zone.id]?.level || DensityLevel.LOW;
              return (
                <radialGradient id={`heat-grad-${zone.id}`} key={zone.id}>
                  <stop offset="0%" stopColor={getDensityColor(density)} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={getDensityColor(density)} stopOpacity="0" />
                </radialGradient>
              );
            })}
          </defs>

          {zones.map((zone) => {
            const density = snapshot?.zones[zone.id];
            const color = density ? getDensityColor(density.level) : DESIGN_TOKENS.colors.stealth[200];
            const isCritical = density?.level === DensityLevel.CRITICAL || density?.level === DensityLevel.HIGH;

            return (
              <g
                key={zone.id}
                className="cursor-pointer outline-none transition-all duration-500 hover:brightness-125 focus:brightness-150"
                onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedZone(zone.id === selectedZone ? null : zone.id)}
                tabIndex={0}
                role="button"
                aria-pressed={selectedZone === zone.id}
                aria-label={`${zone.name} density: ${density?.level || 'Unknown'}`}
              >
                {/* Heat Base */}
                <motion.polygon
                  points={getPointsAttribute(zone.coordinates)}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    fill: color,
                    fillOpacity: selectedZone === zone.id ? 0.3 : 0.15,
                    stroke: selectedZone === zone.id ? color : 'rgba(255,255,255,0.05)',
                    strokeWidth: selectedZone === zone.id ? 1 : 0.2,
                  }}
                  whileHover={{ fillOpacity: 0.4 }}
                  className="transition-all"
                />

                {/* Pulse for High Density */}
                {isCritical && (
                  <motion.polygon
                    points={getPointsAttribute(zone.coordinates)}
                    animate={{
                      fillOpacity: [0.1, 0.4, 0.1],
                    }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    fill={color}
                    className="pointer-events-none"
                    style={{ filter: 'url(#hyper-glow)' }}
                  />
                )}

                {/* Zone Label Floating */}
                <text
                  x={(zone.coordinates[0].x + zone.coordinates[2].x) / 2}
                  y={(zone.coordinates[0].y + zone.coordinates[2].y) / 2}
                  textAnchor="middle"
                  className={cn(
                    "font-bold text-[2px] pointer-events-none tracking-tighter uppercase transition-colors duration-500",
                    selectedZone === zone.id ? "fill-primary" : "fill-white/20"
                  )}
                >
                  {zone.name}
                </text>
              </g>
            );
          })}
        </svg>

        <AnimatePresence>
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="absolute top-8 right-8 w-72 glass-panel p-6 rounded-xl border-white/10 shadow-2xl z-20 backdrop-blur-3xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[8px] uppercase font-bold text-primary tracking-[0.3em] mb-1">Zone Intel</p>
                  <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">
                    {zones.find(z => z.id === selectedZone)?.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                >
                  <Info className="h-3 w-3 opacity-50" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
                    <span className="text-stealth-400">Saturation</span>
                    <span style={{ color: getDensityColor(snapshot?.zones[selectedZone]?.level || DensityLevel.LOW) }}>
                      {Math.round(((snapshot?.zones[selectedZone]?.occupancy || 0) / (zones.find(z => z.id === selectedZone)?.capacity || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 w-full rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(snapshot?.zones[selectedZone]?.occupancy || 0) / (zones.find(z => z.id === selectedZone)?.capacity || 1) * 100}%` }}
                      className="h-full"
                      style={{ backgroundColor: getDensityColor(snapshot?.zones[selectedZone]?.level || DensityLevel.LOW) }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg text-center">
                    <p className="text-[8px] text-stealth-400 uppercase font-black tracking-widest mb-1">Current</p>
                    <p className="text-2xl font-black tracking-tighter">{snapshot?.zones[selectedZone]?.occupancy || 0}</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg text-center">
                    <p className="text-[8px] text-stealth-400 uppercase font-black tracking-widest mb-1">Limit</p>
                    <p className="text-2xl font-black tracking-tighter opacity-40">{zones.find(z => z.id === selectedZone)?.capacity || 0}</p>
                  </div>
                </div>

                {snapshot?.zones[selectedZone]?.level === DensityLevel.CRITICAL && (
                  <motion.div 
                    animate={{ x: [0, -2, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 0.2 }}
                    className="flex items-center gap-3 p-3 bg-critical/20 border border-critical/30 rounded-lg"
                  >
                    <AlertTriangle className="h-5 w-5 text-critical" />
                    <p className="text-[9px] text-critical font-black uppercase leading-tight tracking-tighter">
                      CRITICAL SATURATION: REDIRECT PROTOCOL ACTIVE
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Dynamic Scan Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[scan_4s_linear_infinite]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: MapIcon, label: 'VENUE TOPOLOGY', value: 'Dynamic Mesh', color: 'primary' },
          { icon: RefreshCw, label: 'SYNC LATENCY', value: '< 60ms', color: 'secondary' },
          { icon: Info, label: 'AI PREDICTOR', value: 'Active', color: 'alert' }
        ].map((item, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl border-white/5 group hover:border-primary/20 transition-all flex items-center gap-5">
            <div className={cn("p-4 rounded-xl transition-all group-hover:scale-110", `bg-${item.color}/10 text-${item.color}`)}>
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] text-stealth-400 uppercase font-black tracking-[0.2em] mb-1">{item.label}</p>
              <p className="text-lg font-black tracking-tighter">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
