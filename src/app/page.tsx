import React from 'react';
import Link from 'next/link';
import { Zap, Shield, Users, ArrowRight, Activity, Cpu } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-primary selection:text-background">
      <div className="z-10 w-full max-w-5xl space-y-12 text-center">
        <section className="space-y-4 reveal">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="bg-primary p-2 rounded-md rotate-6 shadow-panel">
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
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto reveal-scale stagger-2">
          {/* Attendee Portal */}
          <Link href="/dashboard" className="group">
            <div className="glass-panel p-8 kinetic-border h-full flex flex-col items-center text-center space-y-6 hover:-translate-y-1 transition-transform rounded-lg">
              <div className="p-4 bg-primary/10 rounded-md text-primary group-hover:bg-primary group-hover:text-background transition-colors">
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
            <div className="glass-panel p-8 kinetic-border h-full flex flex-col items-center text-center space-y-6 hover:-translate-y-1 transition-transform border-critical/20 rounded-lg">
              <div className="p-4 bg-critical/10 rounded-md text-critical group-hover:bg-critical group-hover:text-background transition-colors">
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
        </section>

        {/* Tech Badges */}
        <section className="flex flex-wrap justify-center gap-8 pt-12 border-t border-white/5 opacity-70 reveal stagger-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-tighter">
            <Activity className="h-4 w-4 text-primary" /> SSE_STREAMING_V1
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-tighter">
            <Cpu className="h-4 w-4 text-secondary" /> GEMINI_THINK_OFF
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-tighter">
            <Shield className="h-4 w-4 text-alert" /> VPC_SECURE_NODE
          </div>
        </section>
      </div>

      <footer className="absolute bottom-8 text-[10px] font-bold text-stealth-300 uppercase tracking-[0.3em] opacity-40">
        asia-south1 // cluster-alpha-09
      </footer>
    </main>
  );
}
