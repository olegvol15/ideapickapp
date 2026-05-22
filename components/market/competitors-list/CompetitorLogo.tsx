'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export interface CompetitorLogoProps {
  domain: string;
  name: string;
  iconUrl?: string;
}

export function CompetitorLogo({ domain, name, iconUrl }: CompetitorLogoProps) {
  const src = iconUrl ?? `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  return (
    <Avatar>
      <AvatarImage src={src} alt={`${name} logo`} />
      <AvatarFallback>{name[0]?.toUpperCase() ?? '?'}</AvatarFallback>
    </Avatar>
  );
}
