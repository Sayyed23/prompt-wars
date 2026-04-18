'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Search, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function TicketSync() {
  const [ticketId, setTicketId] = useState('');
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  const handleSync = async () => {
    if (!ticketId) return;
    setStatus('syncing');
    // Simulate API sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStatus('success');
  };

  return (
    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_32px_64px_rgba(0,0,0,0.06)] border border-black/[0.03] max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center">
      {/* Visual Side */}
      <div className="flex-1 w-full max-w-sm">
        <motion.div
          initial={{ rotate: -5, y: 10 }}
          animate={{ rotate: 0, y: 0 }}
          className="relative aspect-[1.6/1] bg-slate-900 rounded-2xl p-8 text-white shadow-2xl overflow-hidden group"
        >
          {/* Holographic Mesh Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent mix-blend-overlay group-hover:opacity-40 transition-opacity" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">VIP Pass</p>
                <h4 className="text-xl font-black tracking-tight">{status === 'success' ? 'Synchronized' : 'TechSummit \'24'}</h4>
              </div>
              <div className="p-2 border border-white/20 rounded-lg">
                <Ticket className="h-5 w-5 text-indigo-400" />
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none">Holder</p>
                <p className="text-sm font-bold uppercase tracking-tight">{status === 'success' ? 'Alex Morgan' : 'Pending Sync...'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none">Access ID</p>
                <p className="text-sm font-mono text-indigo-400">{status === 'success' ? 'CF-1B24-XX' : '---'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Side */}
      <div className="flex-1 space-y-8 w-full">
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Sync your pass.</h3>
          <p className="text-slate-500 font-medium">Unlock personalized navigation and AI assistance.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">1</div>
              <div>
                <h5 className="text-sm font-bold text-slate-900">Enter your Ticket ID</h5>
                <p className="text-[11px] text-slate-500 font-medium">Found on your confirmation email.</p>
                <div className="mt-3 relative">
                  <input
                    type="text"
                    placeholder="e.g. CF-1234-XX"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">2</div>
              <div>
                <h5 className="text-sm font-bold text-slate-900">Confirm & Activate</h5>
                <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Instant verification via secure node.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={status !== 'idle' || !ticketId}
            className={cn(
              "w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3",
              status === 'success' 
                ? "bg-emerald-500 text-white" 
                : "bg-indigo-600 text-white shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 shadow-none hover:shadow-[0_25px_50px_rgba(79,70,229,0.4)]"
            )}
          >
            {status === 'idle' && (
              <>
                <ShieldCheck className="h-4 w-4" />
                Sync Pass
              </>
            )}
            {status === 'syncing' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Activation Complete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
