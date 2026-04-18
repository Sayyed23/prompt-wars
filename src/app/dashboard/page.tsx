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
    <main className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {/* Dynamic Header */}
      <header className="border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-sm shadow-[0_0_10px_rgba(32,232,209,0.3)]">
            <Zap className="h-5 w-5 text-background" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter">
            Crowd<span className="text-primary italic">Flow</span>
          </h1>
        </div>
        
        <div className="hidden md:flex gap-6 items-center">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary opacity-80">
            <ShieldCheck className="h-4 w-4" />
            End-to-End Secure
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary opacity-80">
            <Cpu className="h-4 w-4" />
            AI Optimized
          </div>
        </div>
      </header>

      {/* Desktop Grid Layout (lg and above) */}
      <div className="hidden lg:grid grid-cols-12 gap-8 p-8 flex-1">
        <div className="col-span-8 space-y-8">
          <section className="reveal stagger-1">
            <CrowdHeatmap />
          </section>
          <section className="reveal stagger-2">
            <QueueDisplay />
          </section>
        </div>

        <div className="col-span-4 space-y-8">
          <div className="sticky top-28 space-y-8">
            <section className="reveal stagger-1">
              <AIAssistantChat />
            </section>
            <section className="reveal stagger-2">
              <NotificationCenter />
            </section>
            <section className="reveal stagger-3">
              <WayfindingPane />
            </section>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Tabbed Layout (below lg) */}
      <div className="lg:hidden flex-1 flex flex-col">
        <div className="flex-1 p-4 pb-24 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'map' && (
              <motion.section key="map" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                <CrowdHeatmap />
              </motion.section>
            )}
            {activeTab === 'queues' && (
              <motion.section key="queues" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                <QueueDisplay />
              </motion.section>
            )}
            {activeTab === 'ai' && (
              <motion.section key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <AIAssistantChat />
              </motion.section>
            )}
            {activeTab === 'alerts' && (
              <motion.section key="alerts" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <NotificationCenter />
              </motion.section>
            )}
            {activeTab === 'nav' && (
              <motion.section key="nav" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <WayfindingPane />
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-stealth-100/80 backdrop-blur-xl border-t border-white/5 px-4 py-3 flex justify-around items-center z-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabMode)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-sm transition-all touch-target",
                activeTab === tab.id ? "text-primary scale-110" : "text-stealth-400"
              )}
              aria-label={tab.label}
              aria-pressed={activeTab === tab.id}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Kinetic Footer (Desktop only or below nav) */}
      <footer className="hidden lg:block border-t border-white/5 py-6 px-12 text-center text-stealth-300">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
          &copy; 2026 CrowdFlow Intelligent Systems &bull; asia-south1 Deployment
        </p>
      </footer>
    </main>
  );
}
