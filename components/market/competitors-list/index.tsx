import type { CompetitorAnalysis } from '@/types';
import { CompetitorCard } from './CompetitorCard';

interface CompetitorsListProps {
  competitors: CompetitorAnalysis[];
}

export function CompetitorsList({ competitors }: CompetitorsListProps) {
  if (!competitors?.length) {
    return (
      <p className="text-xs py-6 text-center text-muted-foreground">
        No competitor data available — analysis based on training knowledge
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {competitors.slice(0, 4).map((c) => (
        <CompetitorCard key={c.url} {...c} />
      ))}
    </div>
  );
}
