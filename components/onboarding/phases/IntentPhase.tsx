'use client';

import { motion } from 'framer-motion';
import { slide } from '@/constants/onboarding';

interface Props {
  onSelectHaveIdea: () => void;
  onSelectExplore: () => void;
}

export function IntentPhase({ onSelectHaveIdea, onSelectExplore }: Props) {
  return (
    <motion.div key="intent" {...slide}>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">What do you want to do?</h1>
        </div>
        <div className="flex flex-col gap-3">
          <button
            className="rounded-xl border border-white/[0.08] bg-[#141414] p-5 text-left transition-colors hover:border-white/[0.18]"
            onClick={onSelectHaveIdea}
          >
            <p className="font-semibold text-white/90">I have an idea</p>
            <p className="mt-0.5 text-xs text-white/35">Analyze and validate a specific idea</p>
          </button>
          <button
            className="rounded-xl border border-white/[0.08] bg-[#141414] p-5 text-left transition-colors hover:border-white/[0.18]"
            onClick={onSelectExplore}
          >
            <p className="font-semibold text-white/90">I want to explore ideas</p>
            <p className="mt-0.5 text-xs text-white/35">Discover 3 ideas tailored to your interests</p>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
