'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { slide, fieldInput } from '@/constants/onboarding';

interface Props {
  interest: string;
  setInterest: (v: string) => void;
  onGenerate: () => void;
}

export function InterestPhase({ interest, setInterest, onGenerate }: Props) {
  return (
    <motion.div key="interest" {...slide}>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">What space are you interested in?</h1>
          <p className="mt-2 text-sm text-white/40">Be specific - the more detail, the better the ideas.</p>
        </div>
        <Textarea
          rows={3}
          placeholder="e.g. mental health for teenagers, developer tools, fitness for busy parents…"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className={cn(fieldInput, 'resize-none')}
          autoFocus
        />
        <Button
          className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
          disabled={!interest.trim()}
          onClick={onGenerate}
        >
          Find ideas →
        </Button>
      </div>
    </motion.div>
  );
}
