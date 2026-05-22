'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import type { ValidationPlanTask } from '@/lib/schemas';

interface ValidationPlanBlockProps {
  validationPlan: ValidationPlanTask[];
}

function PlanTask({ task }: { task: ValidationPlanTask }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-3.5 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 shrink-0 mt-[3px] w-16">
          {task.day}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground/85 leading-snug">
            {task.task}
          </p>
          <p className="text-xs text-muted-foreground/55 leading-snug mt-0.5">
            {task.goal}
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-0.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-3.5 pb-3 pt-1 border-t border-border/30 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
            <p className="text-xs text-foreground/70 leading-snug">
              <span className="font-semibold text-emerald-500/80">
                Continue if:{' '}
              </span>
              {task.continueIf}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/70" />
            <p className="text-xs text-foreground/70 leading-snug">
              <span className="font-semibold text-rose-500/80">Kill if: </span>
              {task.killIf}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ValidationPlanBlock({ validationPlan }: ValidationPlanBlockProps) {
  if (validationPlan.length === 0) return null;

  return (
    <div className="border-t border-border/30 pt-8 pb-8 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <SectionHeading>7-Day Validation Plan</SectionHeading>
        <span className="text-xs text-muted-foreground/45 -mt-[2px]">
          tap to expand continue/kill criteria
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {validationPlan.map((task, i) => (
          <PlanTask key={i} task={task} />
        ))}
      </div>
    </div>
  );
}
