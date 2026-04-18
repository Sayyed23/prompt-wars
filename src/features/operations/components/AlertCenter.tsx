'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Shield, Activity, CheckCircle2, UserPlus, Clock } from 'lucide-react';
import { Alert, AlertStatus, AlertPriority, AlertType } from '@/shared/types/alerts';
import { useEventSource } from '@/shared/hooks/useEventSource';
import { DESIGN_TOKENS } from '@/shared/lib/design-tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { data: liveAlert, status } = useEventSource<Alert>('/api/realtime/alerts');

  useEffect(() => {
    fetch('/api/alerts/active')
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(err => console.error('Failed to fetch active alerts:', err));
  }, []);

  useEffect(() => {
    if (liveAlert) {
      setAlerts(prev => {
        // Find if alert already exists, if so update it, otherwise add to front
        const idx = prev.findIndex(a => a.id === liveAlert.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = liveAlert;
          // If resolved, we might want to filter it out or keep it briefly
          return next.filter(a => a.status !== AlertStatus.RESOLVED);
        }
        return [liveAlert, ...prev];
      });
    }
  }, [liveAlert]);

  const updateStatus = async (alertId: string, status: AlertStatus) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts(prev => prev.map(a => a.id === alertId ? updated : a).filter(a => a.status !== AlertStatus.RESOLVED));
      }
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const getPriorityStyles = (p: AlertPriority) => {
    switch (p) {
      case AlertPriority.CRITICAL: return "border-critical text-critical bg-critical/10";
      case AlertPriority.HIGH: return "border-alert text-alert bg-alert/10";
      case AlertPriority.MEDIUM: return "border-secondary text-secondary bg-secondary/10";
      default: return "border-stealth-300 text-stealth-300 bg-stealth-100/50";
    }
  };

  const getTypeIcon = (t: AlertType) => {
    switch (t) {
      case AlertType.CONGESTION: return <Activity className="h-4 w-4" />;
      case AlertType.MEDICAL: return <Activity className="h-4 w-4" />;
      case AlertType.SECURITY: return <Shield className="h-4 w-4" />;
      case AlertType.FACILITY_ISSUE: return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full flex flex-col h-full glass-panel quantum-card-glow overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-stealth-100/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-alert/10 rounded-sm">
            <Bell className="h-5 w-5 text-alert" />
          </div>
          <div>
            <p className="text-[10px] text-stealth-300 uppercase font-bold tracking-widest">Active Incident Stream</p>
            <h2 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
              Alert Command Center
              {status === 'connected' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
            </h2>
          </div>
        </div>
        <div className="px-2 py-1 bg-stealth-200 border border-white/5 rounded-sm text-[10px] font-mono font-bold">
          {alerts.length} OPEN
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"
        role="log"
        aria-label="Active Incident Stream"
        aria-live="assertive"
        aria-relevant="additions text"
      >
        <AnimatePresence initial={false}>
          {alerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center opacity-30"
            >
              <CheckCircle2 className="h-12 w-12 text-primary mb-2" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Sector Clear</p>
            </motion.div>
          ) : (
            alerts.map((alert) => {
              const ariaLabel = `${alert.priority} Priority ${alert.type} Alert at ${alert.locationName}. Status: ${alert.status}. Description: ${alert.description}`;
              
              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  role="article"
                  aria-label={ariaLabel}
                  className={cn(
                    "p-4 border-l-4 rounded-sm flex flex-col gap-3 group relative outline-none focus-within:ring-2 focus-within:ring-primary transition-all duration-300",
                    getPriorityStyles(alert.priority),
                    alert.priority === AlertPriority.CRITICAL && "animate-quantum-pulse shadow-[0_0_15px_rgba(255,0,60,0.2)]"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">{getTypeIcon(alert.type)}</span>
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {alert.type} @ {alert.locationName}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono flex items-center gap-1 opacity-60">
                      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                      <span className="sr-only">Detected at</span>
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-sm font-bold leading-tight line-clamp-2">
                    {alert.description}
                  </p>

                  <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    {alert.status === AlertStatus.UNASSIGNED && (
                      <button 
                        onClick={() => updateStatus(alert.id, AlertStatus.ASSIGNED)}
                        aria-label={`Assign ${alert.type} alert at ${alert.locationName} to me`}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 outline-none focus:ring-1 focus:ring-white"
                      >
                        <UserPlus className="h-3 w-3" aria-hidden="true" /> Assign
                      </button>
                    )}
                    {alert.status !== AlertStatus.RESOLVED && (
                      <button 
                        onClick={() => updateStatus(alert.id, AlertStatus.RESOLVED)}
                        aria-label={`Mark ${alert.type} alert at ${alert.locationName} as resolved`}
                        className="px-3 py-1 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/20 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 outline-none focus:ring-1 focus:ring-primary"
                      >
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Resolve
                      </button>
                    )}
                  </div>

                  {alert.status !== AlertStatus.UNASSIGNED && (
                    <div className="absolute top-2 right-14 px-1.5 py-0.5 bg-white/5 rounded-sm text-[8px] font-bold uppercase tracking-tighter opacity-70" aria-hidden="true">
                      {alert.status}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
