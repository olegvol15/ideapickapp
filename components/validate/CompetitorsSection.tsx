import { CompetitorInsightBlock } from './CompetitorInsightBlock';
import { SectionHeading } from './SectionHeading';
import { normalizeCompetitorBullets } from '@/lib/validate/legacy';
import type { CompetitorInsight } from '@/lib/schemas';

interface CompetitorsSectionProps {
  competitors: CompetitorInsight[];
}

export function CompetitorsSection({ competitors }: CompetitorsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading>Competitors</SectionHeading>
      <div className="grid items-start gap-3 sm:grid-cols-2">
        {competitors.map((competitor, index) => (
          <CompetitorInsightBlock
            key={`${competitor.name}-${index}`}
            competitor={{
              ...competitor,
              likes: normalizeCompetitorBullets(competitor.likes),
              dislikes: normalizeCompetitorBullets(competitor.dislikes),
            }}
          />
        ))}
      </div>
    </div>
  );
}
