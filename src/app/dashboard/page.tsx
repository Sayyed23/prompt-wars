'use client';

import React from 'react';
import LuminaMap from '@/components/attendee/LuminaMap';
import { motion } from 'framer-motion';
import { 
  Zap, 
  MapPin, 
  Users, 
  Clock, 
  MessageSquare, 
  ArrowRight,
  TrendingUp,
  Heart
} from 'lucide-react';
import Link from 'next/link';

export default function AttendeeDashboard() {
  return (
    <div className="space-y-12 pb-24">
      {/* Welcome Hero - Editorial Grade */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
           <div className="bg-primary p-2 rounded-lg">
              <Zap className="h-4 w-4 text-background" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Venue Status: Optimal</span>
        </div>
        <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Your <span className="text-primary italic">Atmosphere</span></h2>
        <p className="text-stealth-400 text-lg font-medium leading-relaxed max-w-2xl">
          Experience a frictionless journey. We've optimized your route based on real-time crowd dynamics and neural session mapping.
        </p>
      </header>

      {/* Primary Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Schedule & Quick Intel */}
        <div className="lg:col-span-4 space-y-10">
          
          {/* Next Up Widget */}
          <div className="bg-foreground text-white rounded-[2.5rem] p-10 shadow-2xl shadow-foreground/20 relative overflow-hidden group">
             <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full">
                      <span className="text-[8px] font-black uppercase tracking-widest text-primary">Next Up in 15m</span>
                   </div>
                   <Clock className="h-5 w-5 text-primary/40" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-tight">Future of Neural Architectures</h3>
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-3">
                   <span>Dr. Elena Vance</span>
                   <span className="opacity-20">//</span>
                   <span>Ballroom A</span>
                </p>
                <Link href="/dashboard/schedule" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary group-hover:gap-5 transition-all">
                   View Full Schedule <ArrowRight className="h-4 w-4" />
                </Link>
             </div>
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          </div>

          {/* Quick Metrics Stack */}
          <div className="space-y-6">
             <div className="bg-white rounded-[2.5rem] border border-card-border p-8 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-black/[0.02] transition-all">
                <div className="flex items-center gap-5">
                   <div className="bg-stealth-100 p-4 rounded-3xl">
                      <Users className="h-6 w-6 text-stealth-400" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-stealth-400 uppercase tracking-widest mb-1">Global Saturation</p>
                      <p className="text-xl font-black tracking-tighter uppercase">Nominal (24%)</p>
                   </div>
                </div>
                <TrendingUp className="h-5 w-5 text-primary" />
             </div>

             <div className="bg-white rounded-[2.5rem] border border-card-border p-8 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-black/[0.02] transition-all">
                <div className="flex items-center gap-5">
                   <div className="bg-stealth-100 p-4 rounded-3xl">
                      <Heart className="h-6 w-6 text-stealth-400" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-stealth-400 uppercase tracking-widest mb-1">Queue Comfort</p>
                      <p className="text-xl font-black tracking-tighter uppercase">High Speed</p>
                   </div>
                </div>
                <Zap className="h-5 w-5 text-primary" />
             </div>
          </div>

          {/* Assistant Quick Entry */}
          <div className="bg-white rounded-[2.5rem] border border-card-border p-10 space-y-6 shadow-sm">
             <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h4 className="text-[10px] font-black tracking-[0.3em] uppercase">Neural Assistant</h4>
             </div>
             <p className="text-xs font-medium leading-relaxed text-stealth-500">
                Ask about the fastest route to the Coffee Lab or check workshop availability.
             </p>
             <Link href="/assistant">
                <button className="w-full py-5 bg-stealth-100 text-foreground rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all duration-300">
                   Open Assistant Chat
                </button>
             </Link>
          </div>
        </div>

        {/* Right Column: Mini Map View */}
        <div className="lg:col-span-8 flex flex-col gap-6">
           <div className="flex-1 bg-white rounded-[2.5rem] border border-card-border p-3 shadow-sm hover:shadow-2xl hover:shadow-black/[0.02] transition-all relative group overflow-hidden">
              <div className="absolute top-10 left-10 z-10 flex items-center gap-3">
                 <div className="bg-white/80 backdrop-blur-xl border border-card-border px-4 py-2 rounded-full flex items-center gap-3 shadow-sm">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-stealth-400">Live Spatial Feed</span>
                 </div>
              </div>
              <div className="h-full min-h-[400px]">
                 <LuminaMap />
              </div>
              <div className="absolute bottom-10 right-10 z-10">
                 <Link href="/dashboard/map">
                    <button className="px-8 py-4 bg-foreground text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-primary hover:text-foreground transition-all duration-300 shadow-2xl shadow-foreground/20">
                       Full Screen Wayfinding
                    </button>
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
