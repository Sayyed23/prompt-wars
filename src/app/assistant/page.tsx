'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AIAssistantChat from '@/components/attendee/AIAssistantChat';
import { 
  ArrowLeft, 
  Pizza, 
  MapPin, 
  LogOut, 
  HeartPulse, 
  Compass, 
  Zap,
  Sparkles
} from 'lucide-react';

const QUICK_ACTIONS = [
  { id: 'food', label: 'Find Food', icon: Pizza, color: '#ffdb29', description: 'Nearest stalls & wait times' },
  { id: 'restroom', label: 'Restrooms', icon: MapPin, color: '#14ffd8', description: 'Locate clean facilities' },
  { id: 'first-aid', label: 'First Aid', icon: HeartPulse, color: '#ff003c', description: 'Emergency medical assistance' },
  { id: 'exit', label: 'Nearest Exit', icon: LogOut, color: '#ff5f1f', description: 'Fastest route out' },
];

export default function AIAssistantPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden selection:bg-primary selection:text-background">
      {/* Premium Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-2xl">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition-colors group">
            <ArrowLeft className="h-5 w-5 text-stealth-400 group-hover:text-primary" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg shadow-[0_0_20px_var(--primary-glow)]">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none">
                Crowd<span className="text-primary italic">Flow</span>
              </h1>
              <p className="text-[8px] text-stealth-500 font-black tracking-[0.4em] uppercase mt-1">Virtual Concierge</p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <Sparkles className="h-3 w-3 text-secondary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stealth-300">Neural Engine: Optimized</span>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full p-6 md:p-10 gap-10">
        
        {/* Left Aspect: Chat Interface */}
        <div className="flex-1 flex flex-col">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <div className="mb-8 pl-4 border-l-2 border-primary">
              <h2 className="text-4xl font-black uppercase tracking-tight mb-2">How can I assist you?</h2>
              <p className="text-stealth-400 text-sm font-medium tracking-wide">
                Ask anything about the venue, schedules, or live crowd status.
              </p>
            </div>
            
            <AIAssistantChat />
          </motion.div>
        </div>

        {/* Right Aspect: Contextual Intelligence & Quick Actions */}
        <div className="w-full lg:w-[450px] space-y-10">
          
          {/* Quick Action Matrix */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stealth-300">Quick Intelligence</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUICK_ACTIONS.map((action, idx) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-panel p-5 text-left group transition-all border-white/5 hover:border-primary/20"
                >
                  <div 
                    className="p-3 rounded-xl mb-4 w-fit transition-transform group-hover:rotate-6"
                    style={{ backgroundColor: `${action.color}15`, color: action.color }}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">
                    {action.label}
                  </h4>
                  <p className="text-[10px] text-stealth-500 font-bold uppercase tracking-wide leading-relaxed">
                    {action.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Live Context Card */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-panel p-8 rounded-3xl relative overflow-hidden group border-white/5"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="h-32 w-32" />
            </div>
            
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-6">Venue Snapshot</p>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                  <p className="text-[9px] font-black text-stealth-500 uppercase tracking-widest mb-1">Total Saturation</p>
                  <p className="text-3xl font-black font-mono">68%</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-primary uppercase animate-pulse">Optimal Flow</p>
                </div>
              </div>
              
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                  <p className="text-[9px] font-black text-stealth-500 uppercase tracking-widest mb-1">Avg. Queue Time</p>
                  <p className="text-3xl font-black font-mono">12m</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-bold text-secondary uppercase">Nominal</p>
                </div>
              </div>
            </div>

            <button className="mt-8 w-full py-4 bg-white/5 hover:bg-primary/10 transition-all rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              View Live Heatmap
            </button>
          </motion.section>

        </div>
      </div>

      {/* Footer Branding */}
      <footer className="py-10 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stealth-500">
          CrowdFlow Neural Core &bull; Node: asia-south1 &bull; Safety Verified
        </p>
      </footer>
    </main>
  );
}
