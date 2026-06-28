import { ActionPlanSection } from './ActionPlanSection';
import { CompetitorsSection } from './CompetitorsSection';
import { EvidenceSection } from './EvidenceSection';
import { ReportTabs } from './ReportTabs';
import type { ReportTab } from './ReportTabs';
import { VerdictSection } from './VerdictSection';
import { evidenceTypeCounts } from '@/lib/evidence/quote-pool';
import { capitalizeFirst } from '@/lib/utils';
import type { PainEvidenceResult } from '@/lib/schemas';

interface ValidationReportProps {
  result: PainEvidenceResult;
  title?: string;
  revealId?: string;
}

export function ValidationReport({
  result,
  title,
  revealId,
}: ValidationReportProps) {
  const competitors = result.competitors ?? [];
  const formattedTitle = title ? capitalizeFirst(title) : '';

  const tabs: ReportTab[] = [
    {
      id: 'verdict',
      label: 'Verdict',
      content: <VerdictSection result={result} revealId={revealId} />,
    },
    {
      id: 'evidence',
      label: 'Evidence',
      count: evidenceTypeCounts(result).complaint,
      content: <EvidenceSection result={result} />,
    },
  ];
  if (competitors.length > 0) {
    tabs.push({
      id: 'competitors',
      label: 'Competitors',
      count: competitors.length,
      content: <CompetitorsSection competitors={competitors} />,
    });
  }
  if (result.actionPlan) {
    tabs.push({
      id: 'action-plan',
      label: 'Action Plan',
      content: (
        <ActionPlanSection
          plan={result.actionPlan}
          result={result}
          title={title ?? ''}
        />
      ),
    });
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {title && (
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
          {formattedTitle}
        </h1>
      )}

      <ReportTabs tabs={tabs} />
    </div>
  );
}
