'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, RefreshCw, AlertCircle, Info, Maximize2, Zap } from 'lucide-react';
import { useEventSource } from '@/shared/hooks/useEventSource';
import { getAllZones } from '@/shared/lib/venue';
import { DensitySnapshot, ZoneDensity, DensityLevel } from '@/shared/types/crowd';
import { Coordinates } from '@/shared/types/venue';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lumina-specific density colors (softer, editorial palette)
const LUMINA_DENSITY_COLORS = {
  [DensityLevel.LOW]: '#e2e8f0', // Slate 200
  [DensityLevel.MODERATE]: '#99f6e4', // Teal 200
  [DensityLevel.HIGH]: '#fde047', // Yellow 300
  [DensityLevel.CRITICAL]: '#fda4af' // Rose 300
};

const WAIT_TIME_BY_ZONE: Record<string, number> = {
  'zone-north-1': 3,
  'zone-south-1': 4,
  'zone-food-1': 7,
  'zone-entry-1': 5,
};

export default function LuminaMap() {
  const [snapshot, setSnapshot] = useState<DensitySnapshot | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const { data: liveUpdate, status } = useEventSource<ZoneDensity>('/api/realtime/density');
  const zones = getAllZones();

  useEffect(() => {
    fetch('/api/crowd/density')
      .then(res => res.json())
      .then(data => setSnapshot(data))
      .catch(err => console.error('Lumina Map: Failed to load density snapshot', err));
  }, []);

  useEffect(() => {
    if (liveUpdate && snapshot) {
      setSnapshot(prev => {
        if (!prev) return null;
        return {
          ...prev,
          zones: { ...prev.zones, [(liveUpdate as any).zoneId]: liveUpdate },
          lastUpdated: new Date().toISOString()
        };
      });
    }
  }, [liveUpdate]);

  const getPointsAttribute = (coords: Coordinates[]) => {
    return coords.map((c) => `${c.x},${c.y}`).join(' ');
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-card-border pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Venue <span className="text-primary">Twin</span></h2>
          <p className="text-[9px] text-stealth-400 font-bold uppercase tracking-[0.3em] mt-2">Real-time Spatial Simulation // Active</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-stealth-100/50 p-1 rounded-xl border border-card-border">
            {Object.entries(LUMINA_DENSITY_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2 px-3 py-1.5 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[8px] font-black uppercase tracking-widest text-stealth-400">{level}</span>
              </div>
            ))}
          </div>
          <button
            className="bg-white border border-card-border p-3 rounded-xl shadow-sm hover:shadow-md transition-all text-stealth-400 hover:text-primary touch-target"
            aria-label="Expand venue map"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] bg-white rounded-[2.5rem] border border-card-border shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden group">
        {/* Architectural Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <svg viewBox="0 0 100 100" className="w-full h-full p-12 lg:p-20" preserveAspectRatio="xMidYMid meet">
          {zones.map((zone) => {
            const density = snapshot?.zones[zone.id];
            const color = density ? LUMINA_DENSITY_COLORS[density.level as keyof typeof LUMINA_DENSITY_COLORS] : '#f1f5f9';
            const isSelected = selectedZone === zone.id;

            return (
              <g key={zone.id} className="cursor-pointer" onClick={() => setSelectedZone(isSelected ? null : zone.id)}>
                {/* Zone Perimeter */}
                <motion.polygon
                  points={getPointsAttribute(zone.coordinates)}
                  animate={{
                    fill: isSelected ? color : '#f8fafc',
                    stroke: isSelected ? color : '#e2e8f0',
                    strokeWidth: isSelected ? 1.5 : 0.5,
                  }}
                  whileHover={{ strokeWidth: 1.5, stroke: color }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
                
                {/* Visual Density Indicators (Subtle Hatching or Dots) */}
                {density && density.level !== DensityLevel.LOW && (
                  <motion.polygon
                    points={getPointsAttribute(zone.coordinates)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isSelected ? 0.4 : 0.2 }}
                    fill={color}
                    className="pointer-events-none"
                  />
                )}

                {/* Highly Refined Labels */}
                <text
                  x={(zone.coordinates[0].x + zone.coordinates[2].x) / 2}
                  y={(zone.coordinates[0].y + zone.coordinates[2].y) / 2}
                  textAnchor="middle"
                  className={cn(
                    "text-[2px] font-black uppercase tracking-tighter transition-all duration-500",
                    isSelected ? "fill-primary" : "fill-stealth-400"
                  )}
                >
                  {zone.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Zone Detail Overlay */}
        <AnimatePresence>
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-10 left-10 right-10 lg:left-auto lg:right-10 lg:w-80 bg-white/80 backdrop-blur-3xl border border-card-border p-8 rounded-3xl shadow-2xl z-20"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                     <Zap className="h-3 w-3 text-primary" />
                     <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Live Insights</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase">{zones.find(z => z.id === selectedZone)?.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="p-2 hover:bg-stealth-100 rounded-full touch-target"
                  aria-label="Close zone details"
                >
                  <Maximize2 className="h-3 w-3 text-stealth-300" />
                </button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stealth-100/30 p-4 rounded-2xl border border-card-border">
                       <p className="text-[8px] font-black text-stealth-400 uppercase tracking-widest mb-1">Pulsing At</p>
                       <p className="text-xl font-black tracking-tighter">{snapshot?.zones[selectedZone]?.occupancy || 0}</p>
                    </div>
                    <div className="bg-stealth-100/30 p-4 rounded-2xl border border-card-border">
                       <p className="text-[8px] font-black text-stealth-400 uppercase tracking-widest mb-1">Wait Time</p>
                       <p className="text-xl font-black tracking-tighter text-primary">{WAIT_TIME_BY_ZONE[selectedZone] ?? 5}m</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-stealth-400">
                       <span>Saturation Gradient</span>
                       <span>{Math.round(((snapshot?.zones[selectedZone]?.occupancy || 0) / (zones.find(z => z.id === selectedZone)?.capacity || 1) * 100))}%</span>
                    </div>
                    <div className="h-1.5 bg-stealth-100 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(snapshot?.zones[selectedZone]?.occupancy || 0) / (zones.find(z => z.id === selectedZone)?.capacity || 1) * 100}%` }}
                          className="h-full bg-primary"
                          transition={{ duration: 1, ease: 'circOut' }}
                       />
                    </div>
                 </div>
                 
                 <button className="w-full py-4 bg-foreground text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-primary hover:text-foreground transition-all duration-300 shadow-xl shadow-foreground/10">
                    Route To Destination
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Map State Indicator */}
        <div className="absolute top-10 left-10 flex flex-col gap-2">
           <div className="bg-white/80 backdrop-blur-xl border border-card-border px-4 py-2 rounded-full flex items-center gap-3 shadow-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stealth-400">Layer: Heat Affinity</span>
           </div>
        </div>
      </div>
    </div>
  );
}
