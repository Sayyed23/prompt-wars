'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation2, MapPin, ChevronRight, Timer, AlertTriangle, Search, Info } from 'lucide-react';
import { Route, Waypoint } from '@/shared/types/navigation';
import { getAllZones } from '@/shared/lib/venue';
import { DESIGN_TOKENS } from '@/shared/lib/design-tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function WayfindingPane() {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const zones = getAllZones();

  const handleFindRoute = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    try {
      const res = await fetch('/api/wayfinding/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originZoneId: origin, destinationZoneId: destination })
      });
      const data = await res.json();
      setRoute(data);
    } catch (err) {
      console.error('Wayfinding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 md:p-8 space-y-6">
      <div className="glass-panel quantum-card-glow p-6 kinetic-border rounded-xl">
        <h2 className="text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
          <Navigation2 className="h-5 w-5 text-primary animate-pulse" />
          Wayfinding_Engine
        </h2>

        <div className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" aria-hidden="true" />
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              aria-label="Select start location"
              className="w-full bg-stealth-100/50 border border-white/10 p-2.5 pl-10 text-sm font-bold uppercase tracking-tight focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option value="">Origin Point</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-alert" aria-hidden="true" />
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              aria-label="Select destination"
              className="w-full bg-stealth-100/50 border border-white/10 p-2.5 pl-10 text-sm font-bold uppercase tracking-tight focus:border-alert outline-none appearance-none cursor-pointer"
            >
              <option value="">Destination Point</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <button
            onClick={handleFindRoute}
            disabled={loading || !origin || !destination}
            aria-label={loading ? "Calculating route..." : "Calculate optimized route"}
            className="w-full py-4 bg-primary text-background font-bold uppercase tracking-widest text-[10px] hover:bg-white transition-all duration-300 disabled:opacity-30 flex justify-center items-center gap-2 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background group"
          >
            {loading ? <Search className="h-4 w-4 animate-spin" /> : (
              <>
                Initialize Path
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {route && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-panel quantum-card-glow p-6 kinetic-border space-y-6 rounded-xl border-white/10"
            role="region"
            aria-label="Wayfinding Path Details"
            aria-live="polite"
          >
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-stealth-300 uppercase font-bold">Estimated Time</p>
                  <div className="flex items-center gap-1 font-mono text-xl font-bold">
                    <Timer className="h-4 w-4 text-primary" aria-hidden="true" />
                    {route.estimatedTimeMinutes}m
                  </div>
                </div>
              </div>
              {route.distanceMetres && (
                <div className="text-right">
                  <p className="text-[10px] text-stealth-300 uppercase font-bold">Total Distance</p>
                  <p className="font-mono text-xl font-bold">{route.distanceMetres}m</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-stealth-300 uppercase font-bold tracking-widest">Turn-by-Turn Path</p>
              <div 
                className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary before:to-stealth-200"
                role="list"
                aria-label="Navigation steps"
              >
                {route.waypoints.map((wp: Waypoint, i: number) => (
                  <div key={i} className="relative" role="listitem">
                    <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center" aria-hidden="true">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">{wp.instruction}</p>
                      <p className="text-[10px] text-stealth-300 uppercase font-bold mt-1">
                        Location: {zones.find(z => z.id === wp.zoneId)?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm flex items-start gap-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[10px] leading-relaxed text-stealth-300">
                Route optimized for minimal crowd density and fastest transit.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
