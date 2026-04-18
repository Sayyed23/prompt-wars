'use client';

import React from 'react';
import LuminaSchedule from '@/components/attendee/LuminaSchedule';
import { motion } from 'framer-motion';

export default function SchedulePage() {
  return (
    <div className="max-w-6xl mx-auto h-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12 pb-24"
      >
        <LuminaSchedule />
      </motion.div>
    </div>
  );
}
