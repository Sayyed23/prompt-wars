'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  AlertCircle, 
  MapPin, 
  Users, 
  ShieldAlert,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { getAllZones } from '@/lib/venue';
import { AlertPriority } from '@/types/alerts';
import { DESIGN_TOKENS } from '@/lib/design-tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AlertCreationForm({ onClose }: { onClose?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    priority: AlertPriority.MEDIUM,
    zoneId: '',
    description: '',
    assignments: [] as string[]
  });

  const zones = getAllZones();
  const staff = [
    { id: 'STAFF_001', name: 'Commander Shepard', role: 'Security' },
    { id: 'STAFF_002', name: 'Garrus Vakarian', role: 'Crowd Control' },
    { id: 'STAFF_003', name: 'Liara T\'Soni', role: 'Medical' },
    { id: 'STAFF_004', name: 'Tali\'Zorah', role: 'Maintenance' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.zoneId || !formData.description) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({ priority: AlertPriority.MEDIUM, zoneId: '', description: '', assignments: [] });
      if (onClose) onClose();
    }, 2000);
  };

  const toggleStaff = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assignments: prev.assignments.includes(id) 
        ? prev.assignments.filter(s => s !== id) 
        : [...prev.assignments, id]
    }));
  };

  return (
    <div className="glass-panel p-6 border-white/10 bg-stealth-800 shadow-2xl max-w-lg w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-sm">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight">Manual Alert Dispatch</h2>
            <p className="text-[10px] text-stealth-400 font-mono uppercase">Sentinel Override Console</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-stealth-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-stealth-400 flex items-center gap-2">
            <ShieldAlert className="h-3 w-3" />
            Priority Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.values(AlertPriority).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData({ ...formData, priority: p })}
                className={cn(
                  "py-2 text-[10px] font-bold uppercase border transition-all",
                  formData.priority === p 
                    ? "bg-white/10 border-white/40 text-white" 
                    : "bg-transparent border-white/5 text-stealth-400 hover:border-white/20"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-stealth-400 flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            Target Distribution Zone
          </label>
          <select 
            required
            value={formData.zoneId}
            onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
            className="w-full bg-stealth-100 border border-white/10 p-3 text-sm rounded-sm focus:border-primary outline-none transition-all appearance-none text-white"
          >
            <option value="" disabled>Select Zone...</option>
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-stealth-400 flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Incident Description & Protocol
          </label>
          <textarea
            required
            placeholder="Describe the incident and required response protocol..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-stealth-100 border border-white/10 p-3 text-sm rounded-sm min-h-[100px] focus:border-primary outline-none transition-all text-white placeholder:text-stealth-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-stealth-400 flex items-center gap-2">
            <Users className="h-3 w-3" />
            Staff Assignment
          </label>
          <div className="grid grid-cols-2 gap-2">
            {staff.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStaff(s.id)}
                className={cn(
                  "p-2 rounded-sm border text-left flex items-center gap-2 transition-all",
                  formData.assignments.includes(s.id)
                    ? "bg-primary/10 border-primary/30 text-white"
                    : "bg-white/5 border-white/5 text-stealth-400 hover:border-white/20"
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-tight leading-none">{s.name}</span>
                  <span className="text-[8px] opacity-60 uppercase font-mono">{s.role}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isSuccess}
          className={cn(
            "w-full py-4 rounded-sm font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all",
            isSuccess 
              ? "bg-success text-stealth-900" 
              : "bg-primary hover:bg-primary/90 text-stealth-900 shadow-[0_0_20px_rgba(32,232,209,0.3)] disabled:opacity-50"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isSubmitting ? 'Dispatching...' : isSuccess ? 'Alert Dispatched' : 'Initialize Broadcast'}
        </button>
      </form>
    </div>
  );
}
