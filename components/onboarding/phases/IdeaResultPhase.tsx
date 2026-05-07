'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuickValidateResponse } from '@/types';
import { fade } from '@/constants/onboarding';
import { verdictColor } from '@/lib/onboarding';

interface Props {
  ideaResult: QuickValidateResponse;
  saving: boolean;
  onExpand: () => void;
}

export function IdeaResultPhase({ ideaResult, saving, onExpand }: Props) {
  const color = verdictColor(ideaResult.score);

  return (
    <motion.div key="idea-result" {...fade} className="space-y-7">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center"
      >
        <p className="text-[5rem] font-black tabular-nums leading-none" style={{ color }}>
          {ideaResult.score}
        </p>
        <p className="mt-2 text-2xl font-black tracking-widest uppercase" style={{ color }}>
          {ideaResult.verdict}
        </p>
      </motion.div>

      <div className="h-px w-full bg-white/[0.07]" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.4 }}>
        <p className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/25">Why</p>
        <ul className="space-y-2.5">
          {ideaResult.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
              <span className="mt-0.5 shrink-0 text-[10px] font-bold" style={{ color }}>✓</span>
              {bullet}
            </li>
          ))}
        </ul>
      </motion.div>

      <div className="h-px w-full bg-white/[0.07]" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, duration: 0.4 }}>
        <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/25">Your next move</p>
        <p className="text-sm leading-relaxed text-white/55">{ideaResult.nextStep}</p>
      </motion.div>

      <div className="h-px w-full bg-white/[0.07]" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.64, duration: 0.4 }}>
        <Button
          className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
          disabled={saving}
          onClick={onExpand}
        >
          {saving
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up…</>
            : 'Improve this idea in dashboard →'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
