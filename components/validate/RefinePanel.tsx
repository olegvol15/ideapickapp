'use client';

import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SUGGESTION_TYPE_STYLE } from '@/lib/validate/colors';
import { buildSuggestions, buildInputHints, reconstruct } from '@/lib/validate/suggestions';
import type { EnhancedValidationResult } from '@/lib/schemas';

interface RefinePanelProps {
  description: string;
  result: EnhancedValidationResult;
  version: number;
  isLoading: boolean;
  onRevalidate: (newDescription: string) => void;
}

export function RefinePanel({ description, result, version, isLoading, onRevalidate }: RefinePanelProps) {
  const suggestions = buildSuggestions(result);
  const hints       = buildInputHints(result);

  const [product, setProduct]     = useState(description);
  const [audience, setAudience]   = useState('');
  const [coreValue, setCoreValue] = useState('');

  const afterText  = reconstruct(product, audience, coreValue);
  const hasChanges = product.trim() !== description.trim() || !!audience.trim() || !!coreValue.trim();

  function reset() { setProduct(description); setAudience(''); setCoreValue(''); }

  return (
    <div className="mt-3 rounded-xl border border-border bg-card px-6 py-5 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Refine Idea</p>
        {version > 1 && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground/75">
            Version {version}
          </span>
        )}
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Edit idea</p>
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1 text-muted-foreground/50 hover:text-muted-foreground hover:bg-transparent">
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 mb-1">Product</span>
          <Textarea
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder={hints.product}
            className="text-sm resize-none min-h-[120px]"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-[80px_1fr] items-start gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 text-right pr-1 pt-2">Audience</span>
          <Textarea
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder={hints.audience}
            className="text-sm resize-none"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-[80px_1fr] items-start gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 text-right pr-1 pt-2">Core value</span>
          <Textarea
            value={coreValue}
            onChange={(e) => setCoreValue(e.target.value)}
            placeholder={hints.coreValue}
            className="text-sm resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Improved version preview */}
      {hasChanges && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] overflow-hidden">
          <div className="px-4 py-2 border-b border-emerald-500/15">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Improved version</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-foreground/90 leading-snug">{afterText}</p>
            {afterText !== description && (
              <p className="text-[11px] text-muted-foreground/45 mt-2 leading-snug line-clamp-1">
                was: {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between gap-3">
        <span />
        <Button
          className={cn('justify-between gap-2', !hasChanges && 'opacity-50')}
          disabled={isLoading || !product.trim()}
          onClick={() => onRevalidate(afterText)}
        >
          {isLoading ? 'Validating…' : 'Test this version'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Ways to improve */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-1 border-t border-border/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Ways to improve</p>
          {suggestions.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/15 px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0', SUGGESTION_TYPE_STYLE[s.type])}>
                  {s.type}
                </span>
                <span className="text-sm font-semibold text-foreground/90 leading-snug">{s.title}</span>
              </div>
              <p className="text-xs text-muted-foreground/65 leading-snug">{s.reason}</p>
              {s.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {s.keywords.map((kw) => (
                    <span key={kw} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground/75 border border-border/60">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
