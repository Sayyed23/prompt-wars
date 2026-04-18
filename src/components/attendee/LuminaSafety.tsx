'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, MapPin, Phone, MessageSquare, AlertTriangle, CheckCircle2, Heart, Zap, Info, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LuminaSafety() {
  const [sosActive, setSosActive] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      {/* Safety Status Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 bg-white rounded-[2.5rem] border border-card-border p-10 shadow-2xl shadow-black/[0.02] relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
             <div className="bg-primary/20 p-2 rounded-lg">
                <ShieldAlert className="h-4 w-4 text-primary" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Safety Protocol</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none italic">Personal <span className="text-foreground not-italic">Guardian</span></h2>
          <p className="text-stealth-400 text-sm font-medium leading-relaxed max-w-sm">
            Real-time emergency coordination and venue safety monitoring.
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
           <div className="text-right">
              <p className="text-[9px] font-black text-stealth-400 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 <span className="text-sm font-black uppercase tracking-tighter">Secure / Shield Active</span>
              </div>
           </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* SOS Command Center */}
        <div className="bg-white rounded-[2.5rem] border border-card-border p-10 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl shadow-black/[0.02]">
           <button 
             onClick={() => setSosActive(!sosActive)}
             className={cn(
               "w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3 transition-all duration-700 relative",
               sosActive ? "bg-critical shadow-[0_40px_100px_rgba(239,68,68,0.4)] scale-110" : "bg-white border-2 border-stealth-100 hover:border-critical/30 shadow-xl shadow-black/5"
             )}
           >
              {sosActive ? (
                <>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-critical/20 rounded-full" />
                  <ShieldAlert className="h-12 w-12 text-white relative z-10" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest relative z-10">SOS Active</span>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-critical/10 rounded-full flex items-center justify-center mb-2">
                    <ShieldAlert className="h-10 w-10 text-critical" />
                  </div>
                  <span className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Press to Signal SOS</span>
                </>
              )}
           </button>
           
           <p className="text-[10px] text-stealth-400 font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
             {sosActive ? "Security and medical teams have been dispatched to your GPS location." : "Triggers immediate medical & security response to your location."}
           </p>

           <AnimatePresence>
             {sosActive && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 className="flex gap-4"
               >
                 <button className="px-6 py-3 bg-white border border-card-border rounded-xl text-[9px] font-black uppercase tracking-widest text-stealth-400 hover:text-foreground">Cancel SOS</button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Safety Features List */}
        <div className="space-y-6">
           {/* Location Sharing */}
           <div className="bg-white rounded-[2rem] border border-card-border p-8 flex items-center justify-between shadow-sm group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-5">
                 <div className="bg-stealth-100 p-4 rounded-2xl group-hover:bg-primary/10 transition-all">
                    <MapPin className="h-6 w-6 text-stealth-400 group-hover:text-primary" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black tracking-tighter uppercase">Signal Casting</h4>
                    <p className="text-[10px] text-stealth-400 font-bold uppercase tracking-widest">Share coordinates with staff</p>
                 </div>
              </div>
              <button 
                onClick={() => setLocationSharing(!locationSharing)}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-colors duration-500 p-1",
                  locationSharing ? "bg-primary" : "bg-stealth-200"
                )}
              >
                <motion.div 
                  animate={{ x: locationSharing ? 24 : 0 }}
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
           </div>

           {/* Emergency Contacts */}
           <div className="bg-white rounded-[2rem] border border-card-border p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-card-border pb-6">
                 <Phone className="h-4 w-4 text-stealth-300" />
                 <h4 className="text-[10px] font-black tracking-[0.3em] uppercase">Emergency Lines</h4>
              </div>
              <div className="space-y-4">
                 {[
                   { label: 'Security Command', icon: ShieldAlert, color: 'primary' },
                   { label: 'Medical Operations', icon: Heart, color: 'alert' },
                   { label: 'Information Desk', icon: Info, color: 'secondary' }
                 ].map((c, i) => (
                   <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-4">
                         <div className={cn("w-2 h-2 rounded-full", `bg-${c.color}`)} />
                         <span className="text-[11px] font-bold uppercase tracking-widest text-stealth-500 group-hover:text-foreground transition-colors">{c.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-stealth-200 group-hover:text-primary transition-colors" />
                   </div>
                 ))}
              </div>
           </div>

           {/* Safety Feed */}
           <div className="bg-foreground rounded-[2rem] p-8 space-y-6 text-white overflow-hidden relative group">
              <div className="flex items-center gap-3 relative z-10">
                 <MessageSquare className="h-4 w-4 text-primary" />
                 <h4 className="text-[10px] font-black tracking-[0.3em] uppercase">Safety Broadcast</h4>
              </div>
              <div className="space-y-4 relative z-10">
                 <div className="flex gap-4">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-[10px] font-medium leading-relaxed opacity-60">Venue exits A and B are currently operating at 10% capacity. Safe transit guaranteed.</p>
                 </div>
                 <div className="flex gap-4">
                    <Info className="h-4 w-4 text-secondary shrink-0" />
                    <p className="text-[10px] font-medium leading-relaxed opacity-60">Medical station 3 has been relocated to Hall G (East Wing).</p>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-all duration-700" />
           </div>
        </div>
      </div>
    </div>
  );
}
