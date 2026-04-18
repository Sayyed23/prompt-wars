'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Shield, Users, ArrowRight, Activity, Cpu } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-primary selection:text-background">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-critical/10 blur-[120px] rounded-full" />
      </div>

      <div className="z-10 w-full max-w-5xl space-y-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="bg-primary p-2 rounded-sm rotate-12">
              <Zap className="h-8 w-8 text-background" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
              Crowd<span className="text-primary italic">Flow</span>
            </h1>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Next-Gen Venue Intelligence. <span className="text-stealth-300">Synchronized. Secure. Predictive.</span>
          </h2>
          
          <p className="text-stealth-300 text-sm md:text-base max-w-xl mx-auto font-medium lowercase tracking-wide">
            leveraging gemini flash 2.0 and real-time edge streaming to orchestrate the pulse of high-density venues with sub-millisecond precision.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto"
        >
          {/* Attendee Portal */}
          <Link href="/dashboard" className="group">
            <div className="glass-panel p-8 kinetic-border h-full flex flex-col items-center text-center space-y-6 hover:translate-y-[-4px] transition-transform">
              <div className="p-4 bg-primary/10 rounded-sm text-primary group-hover:bg-primary group-hover:text-background transition-colors">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Attendee Hub</h3>
                <p className="text-xs text-stealth-300 font-bold uppercase tracking-widest leading-relaxed">
                  Live Heatmaps &bull; Predictive Wayfinding &bull; AI Assistant
                </p>
              </div>
              <div className="mt-auto pt-6 flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
                Access Portal <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Operations Portal */}
          <Link href="/operations" className="group">
            <div className="glass-panel p-8 kinetic-border h-full flex flex-col items-center text-center space-y-6 hover:translate-y-[-4px] transition-transform border-critical/20">
              <div className="p-4 bg-critical/10 rounded-sm text-critical group-hover:bg-critical group-hover:text-background transition-colors">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Control Center</h3>
                <p className="text-xs text-stealth-300 font-bold uppercase tracking-widest leading-relaxed">
                  Alert Matrix &bull; Sector Allocation &bull; Real-time Ops
                </p>
              </div>
              <div className="mt-auto pt-6 flex items-center gap-2 text-critical font-bold uppercase tracking-[0.2em] text-[10px]">
                Initiate Command <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Tech Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex flex-wrap justify-center gap-8 pt-12 border-t border-white/5"
        >
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default text-xs font-mono font-bold tracking-tighter">
            <Activity className="h-4 w-4 text-primary" /> SSE_STREAMING_V1
          </div>
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default text-xs font-mono font-bold tracking-tighter">
            <Cpu className="h-4 w-4 text-secondary" /> GEMINI_THINK_OFF
          </div>
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default text-xs font-mono font-bold tracking-tighter">
            <Shield className="h-4 w-4 text-alert" /> VPC_SECURE_NODE
          </div>
        </motion.div>
      </div>

      <footer className="absolute bottom-8 text-[10px] font-bold text-stealth-300 uppercase tracking-[0.3em] opacity-40">
        asia-south1 // cluster-alpha-09
      </footer>
    </main>
  );
}
