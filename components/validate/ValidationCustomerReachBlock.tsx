'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import type { EnhancedValidationResult } from '@/lib/schemas';

interface ValidationCustomerReachBlockProps {
  customerReach: NonNullable<EnhancedValidationResult['customerReach']>;
}

export function ValidationCustomerReachBlock({
  customerReach,
}: ValidationCustomerReachBlockProps) {
  const { communities, openingMessage, earlyAdopterProfile } = customerReach;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(openingMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-t border-border/30 pt-8 pb-8 flex flex-col gap-4">
      <SectionHeading>Where to Find Your First Users</SectionHeading>

      <div className="flex flex-wrap gap-2">
        {communities.map((c) => (
          <span
            key={c}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-foreground/70 border border-border/40"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="relative rounded-lg border border-border/40 bg-muted/30 px-4 py-3 pr-12">
        <p className="text-sm text-foreground/80 leading-relaxed">{openingMessage}</p>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 text-muted-foreground/50 hover:text-foreground/70 transition-colors"
          aria-label="Copy opening message"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground/60 leading-snug">
        <span className="font-semibold text-muted-foreground/80">Early adopter: </span>
        {earlyAdopterProfile}
      </p>
    </div>
  );
}
