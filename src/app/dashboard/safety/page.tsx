'use client';

import React from 'react';
import LuminaSafety from '@/components/attendee/LuminaSafety';
import { motion } from 'framer-motion';

export default function SafetyPage() {
  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <LuminaSafety />
      </motion.div>
    </div>
  );
}
