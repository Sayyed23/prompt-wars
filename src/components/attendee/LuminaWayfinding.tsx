'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation2, MapPin, ChevronRight, Timer, Search, Info, ArrowRight, RefreshCw } from 'lucide-react';
import { Route } from '@/types/navigation';
import { getAllZones } from '@/lib/venue';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LuminaWayfinding() {
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
      console.error('Lumina Wayfinding: Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 w-full">
      <div className="bg-white rounded-[2.5rem] border border-card-border p-10 shadow-2xl shadow-black/[0.02]">
        <div className="flex items-center gap-3 mb-8">
           <div className="bg-primary/20 p-2 rounded-xl">
              <Navigation2 className="h-5 w-5 text-primary" />
           </div>
           <h3 className="text-xl font-black tracking-tighter uppercase">Path <span className="text-primary">Optimizer</span></h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[9px] font-black uppercase tracking-widest text-stealth-400 px-4">Current Entry Point</label>
             <div className="relative group">
               <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-primary transition-transform group-hover:scale-110" />
               <select
                 value={origin}
                 onChange={(e) => setOrigin(e.target.value)}
                 className="w-full bg-stealth-100/50 border border-card-border rounded-2xl py-5 pl-14 pr-6 text-[11px] font-bold uppercase tracking-tight focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/10 outline-none appearance-none transition-all cursor-pointer"
               >
                 <option value="">Select Origin</option>
                 {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
               </select>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[9px] font-black uppercase tracking-widest text-stealth-400 px-4">Target Destination</label>
             <div className="relative group">
               <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary transition-transform group-hover:scale-110" />
               <select
                 value={destination}
                 onChange={(e) => setDestination(e.target.value)}
                 className="w-full bg-stealth-100/50 border border-card-border rounded-2xl py-5 pl-14 pr-6 text-[11px] font-bold uppercase tracking-tight focus:bg-white focus:border-secondary focus:shadow-xl focus:shadow-secondary/10 outline-none appearance-none transition-all cursor-pointer"
               >
                 <option value="">Select Destination</option>
                 {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
               </select>
             </div>
          </div>

          <button
            onClick={handleFindRoute}
            disabled={loading || !origin || !destination}
            className="w-full py-6 bg-foreground text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary hover:text-foreground transition-all duration-500 disabled:opacity-20 flex justify-center items-center gap-3 shadow-2xl shadow-foreground/20"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : (
              <>
                Compute Optimal Path
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {route && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-white rounded-[2.5rem] border border-primary/20 p-10 shadow-2xl shadow-primary/5 transition-all"
          >
            <div className="flex justify-between items-center mb-8 border-b border-card-border pb-6">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                     <Timer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                     <p className="text-[8px] font-black text-stealth-400 uppercase tracking-widest mb-1">Estimated Travel</p>
                     <p className="text-2xl font-black tracking-tighter">{route.estimatedTimeMinutes} Minutes</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-stealth-400 uppercase tracking-widest mb-1">Total Distance</p>
                  <p className="text-2xl font-black tracking-tighter">{route.distanceMetres}m</p>
               </div>
            </div>

            <div className="space-y-6">
               <p className="text-[9px] font-black text-stealth-400 uppercase tracking-widest mb-4">Maneuver Sequence</p>
               <div className="space-y-6 relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gradient-to-b before:from-primary before:to-stealth-100">
                  {route.waypoints.map((wp, i) => (
                    <div key={i} className="relative group">
                       <div className="absolute -left-[30px] top-1.5 w-5 h-5 rounded-full bg-white border-2 border-primary shadow-sm flex items-center justify-center transition-all group-hover:scale-125">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                       </div>
                       <div>
                          <p className="text-[13px] font-black leading-snug">{wp.instruction}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[8px] font-black uppercase tracking-widest py-1 px-2 bg-stealth-100 rounded-md text-stealth-400">
                                {zones.find(z => z.id === wp.zoneId)?.name}
                             </span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="mt-10 p-5 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
               <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
               <p className="text-[10px] font-medium leading-relaxed text-stealth-500 italic">
                  Dynamic routing engine has selected the path with minimal crowd friction.
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
