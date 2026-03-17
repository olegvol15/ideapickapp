'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export interface CompetitorLogoProps {
  domain: string;
  name: string;
}

export function CompetitorLogo({ domain, name }: CompetitorLogoProps) {
  return (
    <Avatar>
      <AvatarImage
        src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
        alt={`${name} logo`}
      />
      <AvatarFallback>{name[0]?.toUpperCase() ?? '?'}</AvatarFallback>
    </Avatar>
  );
}
