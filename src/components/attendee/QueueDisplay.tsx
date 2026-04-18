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
  const [error, setError] = useState<string | null>(null);
  const facilities = getAllFacilities();

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await fetch('/api/queues/predictions');
        const data = await res.json();
        if (Array.isArray(data)) {
          setPredictions(data);
          setError(null);
        } else {
          setPredictions([]);
          setError(data.error || 'Invalid data format');
        }
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
    <div className="w-full max-w-5xl mx-auto p-4 md:p-10 space-y-10 reveal">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-10 bg-primary rounded-full" />
            <span className="text-[10px] uppercase font-bold text-primary tracking-[0.3em]">Live Intelligence</span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary animate-pulse" />
            Queue <span className="text-gradient">Dynamics</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/5">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span className="text-[9px] uppercase font-bold text-stealth-300 tracking-widest whitespace-nowrap">
            Synchronized: Live Stream
          </span>
        </div>
      </div>

      {error ? (
        <div className="glass-panel p-10 border-critical/20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-critical mx-auto opacity-50" />
          <p className="text-critical font-bold uppercase tracking-widest text-xs">
            Data Stream Interrupted: {error}
          </p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-live="polite"
        >
          {predictions.map((prediction, index) => {
            const facility = facilities.find(f => f.id === prediction.facilityId);
            if (!facility) return null;

            const isLowWait = prediction.waitTimeMinutes < 10;
            const confidenceColor = getConfidenceColor(prediction.confidence);

            return (
              <motion.div
                key={prediction.facilityId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                role="listitem"
                className={cn(
                  "glass-card p-6 rounded-lg group relative flex flex-col justify-between min-h-[180px]",
                  isLowWait && "ring-1 ring-primary/20 bg-primary/[0.02]"
                )}
              >
                {/* Visual Accent */}
                <div 
                  className="absolute top-0 left-0 w-1 h-full opacity-30 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: confidenceColor }}
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-stealth-400 tracking-[0.2em]">
                        {facility.type === FacilityType.ENTRY_GATE ? 'Terminal Access' : 'Refreshment Hub'}
                      </p>
                      <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                        {facility.name}
                      </h3>
                    </div>
                    {isLowWait && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left">
                      {prediction.waitTimeMinutes}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-stealth-400 tracking-widest">min wait</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-white/5 py-1 px-2 rounded-sm">
                    <div 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: confidenceColor, boxShadow: `0 0 8px ${confidenceColor}` }}
                    />
                    <span className="text-[8px] uppercase font-black tracking-widest text-stealth-300">
                      {prediction.confidence} Confidence
                    </span>
                  </div>
                  
                  <button className="p-2 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-background transition-all duration-300">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {predictions.length === 0 && !loading && !error && (
        <div className="text-center p-20 glass-panel border-white/5 reveal">
          <Users className="h-16 w-16 text-stealth-100 mx-auto mb-6" />
          <p className="text-stealth-300 font-bold uppercase tracking-[0.3em] text-xs">
            Awaiting Traffic Data...
          </p>
        </div>
      )}
    </div>
  );
}
