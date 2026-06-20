'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { JourneyMap } from '@/components/validate/JourneyMap';
import { JourneyCaption } from '@/components/validate/JourneyCaption';
import type { Phase } from '@/lib/validate/progress';
import type { EvidenceSource } from '@/types/validate.types';

interface ValidationProgressProps {
  phase: Phase;
  sources: EvidenceSource[];
  description: string;
  onCancel: () => void;
}

export function ValidationProgress({
  phase,
  sources,
  description,
  onCancel,
}: ValidationProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col"
    >
      {/* Description pill */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-4 inline-flex max-w-full self-center rounded-full border border-border/40 bg-muted/30 px-4 py-2"
      >
        <p className="truncate text-base leading-snug text-muted-foreground/60">
          {description.trim().slice(0, 90)}
          {description.trim().length > 90 ? '…' : ''}
        </p>
      </motion.div>

      <JourneyMap phase={phase} />

      <JourneyCaption phase={phase} sources={sources} description={description} />

      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="mx-auto mt-6 text-xs text-muted-foreground/30 hover:bg-transparent hover:text-muted-foreground/60"
      >
        Cancel
      </Button>
    </motion.div>
  );
}
