'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Map as MapIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { useEventSource } from '@/hooks/useEventSource';
import { getAllZones } from '@/lib/venue';
import { getDensityColor } from '@/lib/density';
import { DensitySnapshot, ZoneDensity, DensityLevel } from '@/types/crowd';
import { Coordinates } from '@/types/venue';
import { DESIGN_TOKENS } from '@/lib/design-tokens';
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
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 md:p-8 reveal">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Live Venue Density</h2>
          <p className="text-stealth-300 text-sm mt-1 flex items-center gap-2">
            {status === 'connected' ? (
              <span className="flex items-center gap-1.5 text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live Transmission Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-secondary">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Synchronizing...
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {Object.values(DensityLevel).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 border border-white/10"
                style={{ backgroundColor: getDensityColor(level) }}
              />
              <span className="text-[10px] uppercase font-bold tracking-widest text-stealth-300">{level}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative aspect-[16/10] bg-stealth-100/50 kinetic-border backdrop-blur-sm overflow-hidden p-4">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-2xl"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="map-title map-desc"
        >
          <title id="map-title">Venue Crowd Heatmap</title>
          <desc id="map-desc">A color-coded visual map showing real-time crowd density across different venue zones.</desc>

          {zones.map((zone) => {
            const density = snapshot?.zones[zone.id];
            const color = density ? getDensityColor(density.level) : DESIGN_TOKENS.colors.stealth[200];
            const isCritical = density?.level === DensityLevel.CRITICAL;

            const ariaLabel = `${zone.name}: ${density?.level || 'Unknown'} density. ${density?.occupancy || 0} of ${zone.capacity} capacity.`;

            return (
              <g
                key={zone.id}
                className="cursor-pointer group outline-none focus:ring-1 focus:ring-primary focus:ring-inset"
                onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedZone(zone.id === selectedZone ? null : zone.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={ariaLabel}
                aria-pressed={selectedZone === zone.id}
              >
                <motion.polygon
                  points={getPointsAttribute(zone.coordinates)}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    fill: color,
                    stroke: selectedZone === zone.id ? DESIGN_TOKENS.colors.primary : 'rgba(255,255,255,0.05)',
                  }}
                  whileHover={{ scale: 1.01, stroke: 'rgba(255,255,255,0.5)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="stroke-[0.5]"
                />

                {isCritical && (
                  <motion.polygon
                    points={getPointsAttribute(zone.coordinates)}
                    animate={{
                      opacity: [0.1, 0.4, 0.1],
                      scale: [1, 1.02, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut"
                    }}
                    fill={DESIGN_TOKENS.colors.critical}
                    className="pointer-events-none"
                  />
                )}

                <text
                  x={(zone.coordinates[0].x + zone.coordinates[2].x) / 2}
                  y={(zone.coordinates[0].y + zone.coordinates[2].y) / 2}
                  textAnchor="middle"
                  className="fill-white/80 font-bold text-[3px] pointer-events-none tracking-tighter uppercase"
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-64 glass-panel p-4 kinetic-border z-10"
              role="dialog"
              aria-labelledby="zone-detail-title"
              aria-live="polite"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 id="zone-detail-title" className="font-bold text-lg uppercase tracking-tight">
                  {zones.find(z => z.id === selectedZone)?.name}
                </h3>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="text-stealth-300 hover:text-white p-1"
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-stealth-300 uppercase tracking-widest font-bold text-[10px]">Density Status</span>
                  <span
                    className="font-bold uppercase tracking-widest text-[10px]"
                    style={{ color: getDensityColor(snapshot?.zones[selectedZone]?.level || DensityLevel.LOW) }}
                  >
                    {snapshot?.zones[selectedZone]?.level || 'UNKNOWN'}
                  </span>
                </div>

                <div className="h-1 bg-stealth-200 w-full rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(snapshot?.zones[selectedZone]?.occupancy || 0) / (zones.find(z => z.id === selectedZone)?.capacity || 1) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-stealth-100/50 rounded-sm">
                    <p className="text-[10px] text-stealth-300 uppercase font-bold">Occupancy</p>
                    <p className="text-xl font-mono font-bold">{snapshot?.zones[selectedZone]?.occupancy || 0}</p>
                  </div>
                  <div className="p-2 bg-stealth-100/50 rounded-sm">
                    <p className="text-[10px] text-stealth-300 uppercase font-bold">Capacity</p>
                    <p className="text-xl font-mono font-bold">{zones.find(z => z.id === selectedZone)?.capacity || 0}</p>
                  </div>
                </div>

                {snapshot?.zones[selectedZone]?.level === DensityLevel.CRITICAL && (
                  <div className="flex items-center gap-2 p-2 bg-critical/10 border border-critical/30 rounded-sm">
                    <AlertTriangle className="h-4 w-4 text-critical" />
                    <p className="text-[10px] text-critical font-bold uppercase leading-tight">
                      CRITICAL DENSITY: Seek alternative routes immediately.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 kinetic-border flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-sm text-primary">
            <MapIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-stealth-300 uppercase font-bold">Venue Map</p>
            <p className="text-sm font-bold">Dynamic Spatial Grid</p>
          </div>
        </div>
        <div className="glass-panel p-4 kinetic-border flex items-center gap-4">
          <div className="p-3 bg-secondary/10 rounded-sm text-secondary">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-stealth-300 uppercase font-bold">Sync Interval</p>
            <p className="text-sm font-bold">Sub-60ms Latency</p>
          </div>
        </div>
        <div className="glass-panel p-4 kinetic-border flex items-center gap-4">
          <div className="p-3 bg-alert/10 rounded-sm text-alert">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-stealth-300 uppercase font-bold">Intelligence</p>
            <p className="text-sm font-bold">Predictive Routing Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
