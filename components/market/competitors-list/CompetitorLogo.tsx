'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export interface CompetitorLogoProps {
  domain: string;
  name:   string;
}

export function CompetitorLogo({ domain, name }: CompetitorLogoProps) {
  return (
    <Avatar>
      <AvatarImage
        src={`https://logo.clearbit.com/${domain}`}
        alt={`${name} logo`}
        onError={(e) => {
          // Clearbit failed — fall through to Google favicon before AvatarFallback takes over.
          const img = e.currentTarget;
          if (img.src.includes('clearbit')) {
            img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          }
        }}
      />
      <AvatarFallback>{name[0]?.toUpperCase() ?? '?'}</AvatarFallback>
    </Avatar>
  );
}
