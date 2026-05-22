'use client';

import { SectionHeading } from './SectionHeading';
import type { PivotAngle } from '@/lib/schemas';

interface ValidationPivotBlockProps {
  pivotAngles: PivotAngle[];
}

export function ValidationPivotBlock({ pivotAngles }: ValidationPivotBlockProps) {
  if (pivotAngles.length === 0) return null;

  return (
    <div className="border-t border-border/30 pt-8 pb-8 flex flex-col gap-4">
      <SectionHeading>Stronger Angles to Test</SectionHeading>
      <div className="flex flex-col gap-4">
        {pivotAngles.map((angle, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-foreground/90 leading-snug">
              {angle.title}
            </span>
            <p className="text-sm text-foreground/70 leading-snug">
              {angle.description}
            </p>
            <p className="text-xs text-emerald-500/80 leading-snug font-medium">
              {angle.whyStronger}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
