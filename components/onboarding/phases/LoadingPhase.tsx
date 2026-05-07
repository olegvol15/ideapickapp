'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { fade } from '@/constants/onboarding';

interface Props {
  loadingMsg: string;
}

export function LoadingPhase({ loadingMsg }: Props) {
  return (
    <motion.div key="loading" {...fade} className="flex flex-col items-center justify-center gap-10 py-10">
      <div className="relative flex items-center justify-center">
        <div
          className="h-28 w-28 rounded-full animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(0,119,182,0.5) 0%, rgba(0,119,182,0.08) 60%, transparent 70%)' }}
        />
        <div
          className="absolute h-14 w-14 rounded-full animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(0,119,182,0.95) 0%, rgba(0,119,182,0.4) 50%, transparent 70%)', animationDelay: '150ms' }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={loadingMsg}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="text-sm text-white/45"
        >
          {loadingMsg}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
