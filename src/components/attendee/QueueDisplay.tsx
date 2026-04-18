'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { QueuePrediction, ConfidenceLevel, FacilityType } from '@/types/queue';
import { getAllFacilities } from '@/lib/venue';
import { DESIGN_TOKENS } from '@/lib/design-tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function QueueDisplay() {
  const [predictions, setPredictions] = useState<QueuePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const facilities = getAllFacilities();

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await fetch('/api/queues/predictions');
        const data = await res.json();
        setPredictions(data);
      } catch (err) {
        console.error('Failed to fetch predictions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
    const interval = setInterval(fetchPredictions, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const getConfidenceColor = (level: ConfidenceLevel) => {
    switch (level) {
      case ConfidenceLevel.HIGH: return DESIGN_TOKENS.colors.primary;
      case ConfidenceLevel.MEDIUM: return DESIGN_TOKENS.colors.secondary;
      case ConfidenceLevel.LOW: return DESIGN_TOKENS.colors.alert;
      case ConfidenceLevel.INSUFFICIENT: return DESIGN_TOKENS.colors.stealth[300];
      default: return 'white';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-stealth-100/50 kinetic-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Queue Intel
        </h2>
        <span className="text-[10px] uppercase font-bold text-stealth-300 tracking-widest">
          Updates every 30s
        </span>
      </div>

      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        role="list"
        aria-live="polite"
        aria-busy={loading}
      >
        {predictions.map((prediction, index) => {
          const facility = facilities.find(f => f.id === prediction.facilityId);
          if (!facility) return null;

          const isLowWait = prediction.waitTimeMinutes < 10;
          const ariaLabel = `${facility.name}: ${prediction.waitTimeMinutes} minutes wait. ${(facility.type === FacilityType.ENTRY_GATE ? 'Access Point' : 'Food and Refreshment')}. Confidence: ${prediction.confidence}.`;

          return (
            <motion.div
              key={prediction.facilityId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              role="listitem"
              aria-label={ariaLabel}
              className={cn(
                "glass-panel p-5 kinetic-border group relative overflow-hidden focus-within:ring-2 focus-within:ring-primary outline-none",
                isLowWait && "border-primary/30"
              )}
            >
              {isLowWait && (
                <div className="absolute top-0 right-0 p-1 bg-primary text-background font-bold text-[8px] uppercase tracking-tighter" aria-hidden="true">
                  Fast Choice
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-stealth-300 tracking-widest mb-1">
                    {facility.type === FacilityType.ENTRY_GATE ? 'Access Point' : 'Food & Refreshment'}
                  </p>
                  <h3 className="text-xl font-bold">{facility.name}</h3>
                </div>
                <div className="text-right" aria-hidden="true">
                  <p className="text-4xl font-mono font-bold text-gradient leading-none">
                    {prediction.waitTimeMinutes}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-stealth-300">Minutes</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: getConfidenceColor(prediction.confidence) }}
                    aria-hidden="true"
                  />
                  <p className="text-[10px] uppercase font-bold text-stealth-300 tracking-widest">
                    Confidence: <span style={{ color: getConfidenceColor(prediction.confidence) }}>{prediction.confidence}</span>
                  </p>
                </div>
                
                <button 
                  className="flex items-center gap-1 text-[10px] uppercase font-bold text-primary group-hover:gap-2 transition-all focus:underline outline-none"
                  aria-label={`Get route to ${facility.name}`}
                >
                  Get Route <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {predictions.length === 0 && (
        <div className="text-center p-12 glass-panel kinetic-border">
          <AlertCircle className="h-12 w-12 text-stealth-300 mx-auto mb-4" />
          <p className="text-stealth-300 font-bold uppercase tracking-tight">
            No active queue data available.
          </p>
        </div>
      )}
    </div>
  );
}
