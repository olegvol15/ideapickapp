'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { ActionTemplate } from '@/lib/validate/action-templates';

interface ValidationActionTemplateProps {
  template: ActionTemplate;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
      {children}
    </span>
  );
}

function TemplateContent({ template }: { template: ActionTemplate }) {
  if (template.type === 'reddit-post') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label>Title</Label>
          <p className="text-sm text-foreground/80 leading-snug">{template.title}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Body</Label>
          <p className="text-sm text-foreground/80 leading-snug whitespace-pre-line">{template.body}</p>
        </div>
      </div>
    );
  }

  if (template.type === 'landing-page') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label>Headline</Label>
          <p className="text-sm font-semibold text-foreground/80">{template.headline}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Subheadline</Label>
          <p className="text-sm text-foreground/80 leading-snug">{template.subheadline}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Bullet points</Label>
          <ul className="flex flex-col gap-1">
            {template.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 leading-snug">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1">
          <Label>CTA button</Label>
          <p className="text-sm font-semibold text-foreground/80">{template.cta}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Customer discovery questions</Label>
      <ol className="flex flex-col gap-2">
        {template.questions.map((q, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-snug">
            <span className="shrink-0 text-[11px] font-bold text-muted-foreground/50 mt-[2px] w-3">{i + 1}.</span>
            {q}
          </li>
        ))}
      </ol>
    </div>
  );
}

function templateToText(template: ActionTemplate): string {
  if (template.type === 'reddit-post') {
    return `${template.title}\n\n${template.body}`;
  }
  if (template.type === 'landing-page') {
    return [
      `Headline: ${template.headline}`,
      `Subheadline: ${template.subheadline}`,
      `Bullets:\n${template.bullets.map((b) => `• ${b}`).join('\n')}`,
      `CTA: ${template.cta}`,
    ].join('\n\n');
  }
  return template.questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
}

export function ValidationActionTemplate({ template }: ValidationActionTemplateProps) {
  const [open, setOpen] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(templateToText(template));
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  }

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/70 hover:text-foreground transition-colors"
      >
        {open ? (
          <>
            Hide template <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            See template <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>

      {open && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 mt-2 flex flex-col gap-3">
          <TemplateContent template={template} />
          <button
            onClick={copyAll}
            className="self-start flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <Copy className="h-3 w-3" /> Copy all
          </button>
        </div>
      )}
    </div>
  );
}
