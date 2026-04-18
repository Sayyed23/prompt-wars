'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface FacilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: string;
  statusType?: 'success' | 'warning' | 'error' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  staggerIndex?: number;
}

const statusStyles = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  error: 'bg-rose-50 text-rose-700 border-rose-100',
  info: 'bg-blue-50 text-blue-700 border-blue-100',
};

export default function FacilityCard({
  icon: Icon,
  title,
  description,
  status,
  statusType = 'info',
  actionLabel,
  onAction,
  className,
  staggerIndex = 0,
}: FacilityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: staggerIndex * 0.1, duration: 0.5 }}
      className={cn(
        "bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.03] flex flex-col gap-4 group hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
          <Icon className="h-5 w-5" />
        </div>
        {status && (
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border",
            statusStyles[statusType]
          )}>
            {status}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 font-medium">
          {description}
        </p>
      </div>

      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-auto text-[11px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 hover:gap-3 transition-all"
        >
          {actionLabel}
          <span className="text-lg leading-none">&rarr;</span>
        </button>
      )}
    </motion.div>
  );
}
