'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Bookmark, ChevronRight, Zap, Filter } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Session {
  id: string;
  title: string;
  speaker: string;
  time: string;
  duration: string;
  location: string;
  zoneId: string;
  type: 'Keynote' | 'Workshop' | 'Networking' | 'Breakout';
  isBookmarked: boolean;
  saturation: number; // Mocked crowd data for UI demo
}

const MOCK_SESSIONS: Session[] = [
  {
    id: '1',
    title: 'Future of Neural Architectures',
    speaker: 'Dr. Elena Vance',
    time: '14:00',
    duration: '60 min',
    location: 'Grand Ballroom A',
    zoneId: 'ballroom_a',
    type: 'Keynote',
    isBookmarked: true,
    saturation: 85
  },
  {
    id: '2',
    title: 'Edge Computing Post-2025',
    speaker: 'Marcus Thorne',
    time: '15:15',
    duration: '45 min',
    location: 'Satellite Hall C',
    zoneId: 'hall_c',
    type: 'Workshop',
    isBookmarked: false,
    saturation: 30
  },
  {
    id: '3',
    title: 'Visual Design Ethics',
    speaker: 'Sarah Lin',
    time: '16:30',
    duration: '30 min',
    location: 'The Atrium',
    zoneId: 'atrium',
    type: 'Breakout',
    isBookmarked: true,
    saturation: 12
  },
  {
    id: '4',
    title: 'Global Connectivity Mixer',
    speaker: 'Community Lead',
    time: '18:00',
    duration: '90 min',
    location: 'Lounge Level 2',
    zoneId: 'lounge',
    type: 'Networking',
    isBookmarked: false,
    saturation: 65
  }
];

export default function LuminaSchedule() {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [activeFilter, setActiveFilter] = useState<'All' | Session['type']>('All');

  const filteredSessions = activeFilter === 'All' 
    ? sessions 
    : sessions.filter(s => s.type === activeFilter);

  const toggleBookmark = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isBookmarked: !s.isBookmarked } : s));
  };

  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="bg-primary p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-background" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Your Itinerary</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none italic underline decoration-primary/20 underline-offset-8">Conference <span className="text-primary not-italic">Pulse</span></h2>
        </div>

        <div className="flex flex-wrap gap-2 bg-stealth-100/50 p-1.5 rounded-[2rem] border border-card-border overflow-x-auto no-scrollbar max-w-full">
           {['All', 'Keynote', 'Workshop', 'Breakout', 'Networking'].map((filter) => (
             <button
               key={filter}
               onClick={() => setActiveFilter(filter as any)}
               className={cn(
                 "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                 activeFilter === filter ? "bg-white text-foreground shadow-lg shadow-black/5" : "text-stealth-400 hover:text-foreground"
               )}
             >
               {filter}
             </button>
           ))}
        </div>
      </div>

      {/* Session Grid/List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group bg-white rounded-[2.5rem] border border-card-border p-3 hover:p-1 hover:border-primary/20 transition-all duration-700 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer relative overflow-hidden"
            >
               <div className="bg-white rounded-[2.2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-8 w-full md:w-auto">
                     {/* Time & Indicator */}
                     <div className="flex flex-col items-center justify-center p-6 bg-stealth-100/50 rounded-3xl min-w-[100px] border border-card-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-700">
                        <span className="text-2xl font-black tracking-tighter leading-none">{session.time}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-stealth-400 mt-2">{session.duration}</span>
                     </div>

                     {/* Main Intel */}
                     <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <span className={cn(
                              "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border transition-colors",
                              session.type === 'Keynote' ? "bg-primary/10 border-primary/20 text-primary" : "bg-stealth-100 border-card-border text-stealth-400"
                           )}>
                              {session.type}
                           </span>
                           {session.saturation > 80 && (
                              <div className="flex items-center gap-1.5">
                                 <Users className="h-3 w-3 text-alert" />
                                 <span className="text-[8px] font-black uppercase tracking-widest text-alert">High Density</span>
                              </div>
                           )}
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors">{session.title}</h3>
                        <p className="text-[11px] font-bold text-stealth-400 uppercase tracking-widest flex items-center gap-2">
                           <span className="text-foreground">{session.speaker}</span>
                           <span className="opacity-20">//</span>
                           <span className="flex items-center gap-1.5">
                             <MapPin className="h-3 w-3" />
                             {session.location}
                           </span>
                        </p>
                     </div>
                  </div>

                  {/* Actions & Stats */}
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-card-border pt-6 md:pt-0">
                     <div className="flex flex-col items-end px-8 border-r border-card-border">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(dot => (
                                 <div 
                                    key={dot} 
                                    className={cn(
                                       "w-1 h-3 rounded-full transition-all duration-500",
                                       dot * 20 <= session.saturation ? "bg-primary scale-y-125" : "bg-stealth-100"
                                    )} 
                                 />
                              ))}
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest">Saturation</span>
                        </div>
                        <span className="text-xs font-black font-mono">
                           {session.saturation}% Capacity
                        </span>
                     </div>

                     <div className="flex items-center gap-4">
                        <button 
                           onClick={(e) => { e.stopPropagation(); toggleBookmark(session.id); }}
                           className={cn(
                             "p-4 rounded-2xl border transition-all duration-500",
                             session.isBookmarked ? "bg-primary border-primary text-background shadow-lg shadow-primary/20" : "bg-white border-card-border text-stealth-300 hover:text-primary hover:border-primary/50"
                           )}
                        >
                           <Bookmark className={cn("h-5 w-5", session.isBookmarked && "fill-background")} />
                        </button>
                        <div className="p-4 bg-foreground text-white rounded-2xl group-hover:bg-primary group-hover:text-foreground transition-all duration-500 shadow-xl shadow-foreground/10 group-hover:shadow-primary/20">
                           <ChevronRight className="h-5 w-5" />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Soft Background Pulse */}
               <div className="absolute -inset-10 bg-primary/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Suggestion Notification */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-foreground p-1 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
         <div className="bg-white/5 backdrop-blur-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white border border-white/10 rounded-[2.3rem]">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/30 relative">
                  <Zap className="h-8 w-8 text-primary" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
               </div>
               <div>
                  <h4 className="text-xl font-black tracking-tighter uppercase leading-none mb-2">Smart Suggestion</h4>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Based on your interests & movement</p>
               </div>
            </div>
            <p className="text-xs font-medium text-white/70 max-w-sm text-center md:text-left">
              "The Gallery Showcase" starts in 20m. Crowd density is exceptionally low (5%). Recommend early arrival via Level 2 Bridge.
            </p>
            <button className="px-10 py-5 bg-white text-foreground rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all duration-300">
               Optimize Route
            </button>
         </div>
      </motion.div>
    </div>
  );
}
