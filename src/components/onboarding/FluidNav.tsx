'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Zap, User } from 'lucide-react';

export default function FluidNav() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl rounded-2xl border border-black/[0.03] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter text-indigo-950 uppercase">CrowdFlow</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-b-2 border-indigo-600 pb-0.5">Home</Link>
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Dashboard</Link>
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Schedule</Link>
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Network</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 w-64 group focus-within:border-indigo-200 transition-all">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search events, halls..." 
              className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-900 placeholder:text-slate-300 w-full"
            />
          </div>
          
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
            Ask AI
          </button>
          
          <div className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 overflow-hidden">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </nav>
  );
}
