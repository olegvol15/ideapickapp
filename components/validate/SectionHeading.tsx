import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  children: React.ReactNode;
  color?: string;
}

export function SectionHeading({ children, color }: SectionHeadingProps) {
  return (
    <p
      className={cn(
        'text-[10px] font-bold uppercase tracking-widest',
        color ?? 'text-muted-foreground/70'
      )}
    >
      {children}
    </p>
  );
}
