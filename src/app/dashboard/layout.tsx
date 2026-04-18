'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map as MapIcon, 
  Calendar, 
  ShieldCheck as Shield, 
  MessageSquare, 
  Compass, 
  Zap,
  LayoutDashboard,
  User
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { id: 'home', icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { id: 'map', icon: MapIcon, label: 'Wayfinding', href: '/dashboard/map' },
    { id: 'schedule', icon: Calendar, label: 'Schedule', href: '/dashboard/schedule' },
    { id: 'assistant', icon: MessageSquare, label: 'Assistant', href: '/assistant' },
    { id: 'safety', icon: Shield, label: 'Safety', href: '/dashboard/safety' },
  ];

  return (
    <div className="lumina-flow min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground relative flex flex-col lg:flex-row transition-colors duration-700">
      
      {/* Desktop Sidebar - Editorial Grade */}
      <aside className="hidden lg:flex flex-col w-80 border-r border-card-border bg-card-bg/50 backdrop-blur-3xl z-40 relative">
        <div className="p-10">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-primary p-2 rounded-xl shadow-[0_10px_30px_var(--primary-glow)] group-hover:rotate-12 transition-transform duration-500">
              <Zap className="h-6 w-6 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none">
                Crowd<span className="text-primary italic">Flow</span>
              </h1>
              <span className="text-[7px] font-black text-stealth-400 uppercase tracking-[0.5em] block mt-1">Persona: Attendee</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-8 space-y-4 pt-4">
          <p className="text-[10px] font-black text-stealth-300 uppercase tracking-[0.3em] mb-6 px-4">Navigation</p>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative group",
                  isActive ? "bg-white shadow-xl shadow-black/5 text-foreground" : "text-stealth-400 hover:text-foreground hover:bg-white/50"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="desktop-nav-active" 
                    className="absolute inset-x-0 inset-y-0 bg-white shadow-lg shadow-black/5 rounded-2xl -z-10" 
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "text-primary scale-110")} />
                <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-8">
           <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary/30 p-1">
                 <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                 </div>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1">Alpha Guest</p>
                 <span className="text-[8px] text-stealth-400 font-bold uppercase">ID: CF-992-QX</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-h-0 bg-background/50 relative overflow-hidden">
        
        {/* Soft Ambient Background Elements */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/2 -left-24 w-80 h-80 bg-secondary/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Global Header (Mobile Only / Content Desktop) */}
        <header className="h-20 border-b border-card-border flex items-center justify-between px-8 backdrop-blur-3xl z-30 lg:h-24">
           <div className="lg:hidden flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Zap className="h-4 w-4 text-background" />
              </div>
              <h1 className="text-lg font-black tracking-tighter uppercase">CrowdFlow</h1>
           </div>
           
           <div className="hidden lg:flex flex-col">
              <div className="flex items-center gap-2 text-primary">
                 <Compass className="h-4 w-4" />
                 <span className="text-[9px] font-black uppercase tracking-[0.3em]">Neural Routing Active</span>
              </div>
              <p className="text-[8px] text-stealth-400 font-bold uppercase tracking-widest mt-1">Venue: Omega Exhibition Center // Zone Status: Nominal</p>
           </div>

           <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end px-6 border-r border-card-border">
                 <span className="text-[8px] font-black text-stealth-400 uppercase tracking-widest mb-1">Queue Score</span>
                 <span className="text-lg font-black text-foreground">92/100</span>
              </div>
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white border border-card-border shadow-sm flex items-center justify-center group hover:border-primary/50 transition-colors cursor-pointer">
                 <User className="h-5 w-5 text-stealth-400 group-hover:text-primary transition-colors" />
              </div>
           </div>
        </header>

        {/* Dynamic Route Container */}
        <div className="flex-1 relative overflow-y-auto custom-scrollbar z-10 p-6 md:p-10 lg:p-12">
           <AnimatePresence mode="wait">
             <motion.div
               key={pathname}
               initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
               animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
               exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
               transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
               className="h-full"
             >
               {children}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>

      {/* Mobile Navigation - Glass Pill */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md z-50">
        <nav className="bg-white/80 backdrop-blur-2xl border border-white shadow-2xl shadow-black/5 p-2 rounded-[2.5rem] flex items-center justify-around gap-1">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 px-5 py-3 rounded-[2rem] transition-all group",
                  isActive ? "text-primary" : "text-stealth-400"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="mobile-nav-active" 
                    className="absolute inset-0 bg-primary/10 rounded-[2rem]" 
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn("h-5 w-5 relative z-10 transition-transform duration-300", isActive && "scale-110")} />
                <span className="text-[7px] font-black uppercase tracking-[0.2em] relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }
      `}</style>
    </div>
  );
}
