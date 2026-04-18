'use client';

import React from 'react';
import LuminaMap from '@/components/attendee/LuminaMap';
import LuminaWayfinding from '@/components/attendee/LuminaWayfinding';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Info } from 'lucide-react';

export default function WayfindingPage() {
  return (
    <div className="flex flex-col lg:flex-row gap-10 h-full">
      {/* Sidebar Navigation Details */}
      <div className="w-full lg:w-[450px] shrink-0 space-y-10">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="bg-primary p-2 rounded-lg">
                <Navigation className="h-4 w-4 text-background" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Spatial Navigation</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Venue <span className="text-primary italic">Wayfinding</span></h2>
          <p className="text-stealth-400 text-sm font-medium leading-relaxed max-w-sm">
            Leverage real-time crowd data to calculate the most efficient path through the venue.
          </p>
        </header>

        <LuminaWayfinding />

        {/* Quick Tips / Meta Data */}
        <div className="p-8 bg-stealth-100/30 rounded-[2.5rem] border border-card-border">
           <div className="flex items-center gap-4 mb-6">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-card-border">
                 <Info className="h-4 w-4 text-primary" />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">Proximity Tips</h4>
           </div>
           
           <div className="space-y-6">
              <div className="flex gap-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                 <p className="text-[10px] font-bold text-stealth-500 leading-relaxed uppercase tracking-tight">
                    Avoid <span className="text-foreground">Zone B</span> until 14:00 due to key session exit flow.
                 </p>
              </div>
              <div className="flex gap-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                 <p className="text-[10px] font-bold text-stealth-500 leading-relaxed uppercase tracking-tight">
                    The <span className="text-foreground">Main Hall</span> queue is currently moving faster than average.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Map Interface */}
      <div className="flex-1 min-h-[600px] lg:min-h-0 relative">
        <LuminaMap />
      </div>

      <style jsx global>{`
        @keyframes scan {
          from { transform: translateY(0); opacity: 0; }
          50% { opacity: 0.5; }
          to { transform: translateY(600px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
