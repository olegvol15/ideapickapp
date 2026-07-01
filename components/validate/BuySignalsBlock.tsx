import { cva } from 'class-variance-authority';
import { PainQuoteItem } from './PainQuoteItem';
import { SectionHeading } from './SectionHeading';
import { cn } from '@/lib/utils';
import { computeWtpSignal } from '@/lib/evidence/wtp-signal';
import type { WtpLevel } from '@/lib/evidence/wtp-signal';
import type { PainEvidenceResult } from '@/lib/schemas';

interface BuySignalsBlockProps {
  result: PainEvidenceResult;
}

const LEVEL_COPY: Record<Exclude<WtpLevel, 'none'>, string> = {
  strong: 'Strong buy intent',
  weak: 'Some buy intent',
};

const badge = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      level: {
        strong: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        weak: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      },
    },
  }
);

export function BuySignalsBlock({ result }: BuySignalsBlockProps) {
  const signal = computeWtpSignal(result);
  if (signal.level === 'none') return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SectionHeading>Willingness to Pay</SectionHeading>
        <span className={cn(badge({ level: signal.level }))}>
          {LEVEL_COPY[signal.level]}
        </span>
        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs tabular-nums text-muted-foreground/70">
          {signal.count} buy signal{signal.count !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-sm text-muted-foreground/60">
        People saying they&rsquo;d pay, already pay for a rival, or want to switch
        &mdash; the strongest demand evidence we can cite.
      </p>
      <div className="flex flex-wrap items-stretch gap-3">
        {signal.examples.map((quote, i) => (
          <div
            key={`${quote.url ?? ''}-${i}`}
            className="min-w-0 flex-1 basis-full sm:basis-[calc((100%-0.75rem)/2)] lg:basis-[calc((100%-1.5rem)/3)]"
          >
            <PainQuoteItem quote={quote} />
          </div>
        ))}
      </div>
    </section>
  );
}
