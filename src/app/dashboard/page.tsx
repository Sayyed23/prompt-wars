'use client';

import React, { useState } from 'react';
import CrowdHeatmap from '@/components/attendee/CrowdHeatmap';
import QueueDisplay from '@/components/attendee/QueueDisplay';
import WayfindingPane from '@/components/attendee/WayfindingPane';
import AIAssistantChat from '@/components/attendee/AIAssistantChat';
import { NotificationCenter } from '@/components/attendee/NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck, Cpu, Map as MapIcon, Scale, MessageSquare, Compass, Bell } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabMode = 'map' | 'queues' | 'ai' | 'nav' | 'alerts';

export default function AttendeeDashboard() {
  const [activeTab, setActiveTab] = useState<TabMode>('map');

  const tabs = [
    { id: 'map', icon: MapIcon, label: 'Map' },
    { id: 'queues', icon: Scale, label: 'Queues' },
    { id: 'ai', icon: MessageSquare, label: 'Assistant' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'nav', icon: Compass, label: 'Directions' },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden selection:bg-primary selection:text-background relative">
      {/* Premium Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      </div>

      {/* Dynamic Header - Refined Premium */}
      <header className="border-b border-white/5 py-6 px-8 md:px-16 flex justify-between items-center glass-panel sticky top-0 z-50 backdrop-blur-2xl">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="bg-primary p-2 rounded-xl shadow-[0_0_25px_var(--primary-glow)] group-hover:scale-110 transition-transform duration-500">
            <Zap className="h-6 w-6 text-background" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">
              Crowd<span className="text-primary italic">Flow</span>
            </h1>
            <p className="text-[8px] text-stealth-500 font-bold tracking-[0.4em] uppercase mt-1">Intelligent Operations</p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-8 items-center">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <ShieldCheck className="h-4 w-4" />
              Quantum-Secure
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary mt-1">
              <Cpu className="h-4 w-4" />
              Engine: Active
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-10 p-10 md:p-16 flex-1 relative z-10">
        <div className="col-span-8 space-y-12">
          <section className="reveal">
            <CrowdHeatmap />
          </section>
          <section className="reveal" style={{ animationDelay: '0.2s' }}>
            <QueueDisplay />
          </section>
        </div>

        <div className="col-span-4 space-y-10">
          <div className="sticky top-32 space-y-10">
            <section className="reveal" style={{ animationDelay: '0.4s' }}>
              <AIAssistantChat />
            </section>
            <section className="reveal" style={{ animationDelay: '0.6s' }}>
              <NotificationCenter />
            </section>
            <section className="reveal" style={{ animationDelay: '0.8s' }}>
              <WayfindingPane />
            </section>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Tabbed Layout */}
      <div className="lg:hidden flex-1 flex flex-col relative z-10">
        <div className="flex-1 p-6 pb-32 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.section 
              key={activeTab}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full"
            >
              {activeTab === 'map' && <CrowdHeatmap />}
              {activeTab === 'queues' && <QueueDisplay />}
              {activeTab === 'ai' && <AIAssistantChat />}
              {activeTab === 'alerts' && <NotificationCenter />}
              {activeTab === 'nav' && <WayfindingPane />}
            </motion.section>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Bar - Glassmorphic Pill */}
        <div className="fixed bottom-8 left-4 right-4 z-50 flex justify-center">
          <nav className="bg-white/5 backdrop-blur-3xl border border-white/10 px-6 py-3 rounded-full flex justify-around items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-md">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabMode)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 px-4 py-2 rounded-full transition-all group",
                  activeTab === tab.id ? "text-primary" : "text-stealth-400 hover:text-stealth-200"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="tab-active" 
                    className="absolute inset-0 bg-primary/10 rounded-full" 
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} 
                  />
                )}
                <tab.icon className={cn("h-5 w-5 relative z-10 transition-transform duration-300", activeTab === tab.id && "scale-110")} />
                <span className="text-[8px] font-black uppercase tracking-widest relative z-10">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Kinetic Footer */}
      <footer className="hidden lg:block border-t border-white/5 py-10 px-16 text-center text-stealth-500 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-stealth-400/20 to-transparent" />
          <p className="text-[9px] font-black uppercase tracking-[0.4em]">
            &copy; 2026 CrowdFlow Neural Core &bull; Node: asia-south1-p1 &bull; Status: Optimized
          </p>
        </div>
      </footer>
    </main>
  );
}
