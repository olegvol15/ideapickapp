'use client';

import { useState } from 'react';

export interface CompetitorLogoProps {
  domain: string;
  name: string;
}

const BASE_STYLE = {
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-subtle)',
};

export function CompetitorLogo({ domain, name }: CompetitorLogoProps) {
  const [src, setSrc] = useState(`https://logo.clearbit.com/${domain}`);
  const [dead, setDead] = useState(false);

  if (dead) {
    return (
      <div
        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold uppercase select-none"
        style={{ ...BASE_STYLE, color: 'var(--text-3)' }}
      >
        {name[0] ?? '?'}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-10 w-10 shrink-0 rounded-xl object-contain p-1"
      style={BASE_STYLE}
      onError={() => {
        if (src.includes('clearbit')) {
          setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
        } else {
          setDead(true);
        }
      }}
    />
  );
}
