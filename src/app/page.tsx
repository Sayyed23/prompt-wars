'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Zap, 
  MapPin, 
  Clock, 
  Bell, 
  Activity, 
  ArrowRight,
  TrendingDown,
  ChevronRight,
  Mic2
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import FluidNav from '@/components/onboarding/FluidNav';
import FacilityCard from '@/components/onboarding/FacilityCard';
import TicketSync from '@/components/onboarding/TicketSync';

export default function Home() {
  return (
    <main className="lumina-flow relative min-h-screen bg-[#fbfbfc] text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-600">
      <FluidNav />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          <div className="flex-1 space-y-8 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Live Venue Pulse Active</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-indigo-950">
              Flow with the <span className="text-indigo-600">Crowd</span>
            </h1>

            <p className="text-lg text-slate-500 font-medium max-w-lg leading-relaxed lowercase">
              experience seamless event navigation. the fluid concierge guides you through venues effortlessly, anticipating your needs before you do.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
                Get Started <ArrowRight className="h-4 w-4" />
              </button>
              <button className="bg-white border border-slate-100 text-slate-900 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
                Explore Venues
              </button>
            </div>
          </div>

          <div className="flex-1 w-full reveal stagger-2">
            <div className="relative rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.1)] group">
              {/* Using a high-quality descriptive placeholder for the concert image */}
              <div className="aspect-[1.1/1] bg-slate-100 overflow-hidden">
                <div 
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop")' }}
                />
              </div>

              {/* Status Overlay */}
              <div className="absolute bottom-10 left-10 right-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/60 backdrop-blur-3xl p-8 rounded-3xl border border-white/10 shadow-3xl"
                >
                  <div className="flex justify-between items-center mb-4 text-white">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-1">Current Status</p>
                      <h4 className="text-2xl font-black">Main Stage Density</h4>
                    </div>
                    <div className="bg-emerald-400 text-slate-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      Comfortable
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.5)]" 
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pulse Section */}
      <section className="bg-indigo-50/20 py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-4xl font-black tracking-tight text-indigo-950">Live Venue Pulse</h2>
            <p className="text-slate-500 font-medium">Real-time insights into crowd flow, helping you find the best spots and avoid the bottleneck.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <FacilityCard 
              icon={TrendingDown}
              title="Optimal Route to North Hall"
              description="Traffic is light via the East Corridor. Estimated time: 3 mins."
              status="Live Suggestion"
              statusType="info"
              actionLabel="View Map"
              staggerIndex={1}
            />
            <FacilityCard 
              icon={TrendingDown}
              title="Central Food Court"
              description="High density. Wait times approx 15-20 mins."
              status="Busy"
              statusType="error"
              staggerIndex={2}
            />
            <FacilityCard 
              icon={TrendingDown}
              title="West Wing Restrooms"
              description="Low density. No wait time."
              status="Clear"
              statusType="success"
              staggerIndex={3}
            />
            <FacilityCard 
              icon={Mic2}
              title="Keynote: Future of AI in Design"
              description="Main Stage • Hall A"
              status="Starts in 15 mins"
              statusType="info"
              actionLabel="Navigate to Stage"
              staggerIndex={4}
            />
          </div>
        </div>
      </section>

      {/* Onboarding / Ticket Section */}
      <section className="py-32 px-6 pb-48">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-indigo-950">Have a Ticket?</h2>
            <p className="text-slate-500 font-medium">Sync your pass to unlock personalized concierge features.</p>
          </div>
          
          <TicketSync />
        </div>
      </section>

      <footer className="border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            <span className="text-lg font-black uppercase tracking-tighter text-indigo-950">CrowdFlow</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            © 2026 CrowdFlow. The Fluid Concierge.
          </div>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service', 'Support Center'].map(item => (
              <Link key={item} href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
