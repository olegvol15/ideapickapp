'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  FlaskConical,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SectionHeading } from './SectionHeading';
import {
  buildIdeaFromValidation,
  buildWorkspaceTasks,
} from '@/lib/validate/build-workspace-from-validation';
import { setPlan } from '@/services/storage.service';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { ActionPlan, PainEvidenceResult } from '@/lib/schemas';

interface ActionPlanSectionProps {
  plan: ActionPlan;
  result: PainEvidenceResult;
  title: string;
}

export function ActionPlanSection({
  plan,
  result,
  title,
}: ActionPlanSectionProps) {
  const router = useRouter();

  function handleGenerateWorkspace() {
    const idea = buildIdeaFromValidation(result, title);
    const ideaId = setPlan(idea);
    const store = useWorkspaceStore.getState();

    // Seed once — re-clicking just reopens the existing workspace.
    if (!store.todos[ideaId]?.length) {
      store.setWorkspaceIdea(ideaId, idea);
      buildWorkspaceTasks(plan).forEach((task) => store.addTask(ideaId, task));
      toast.success('Workspace created from your plan');
    }

    router.push(`/workspace/${ideaId}`);
  }

  return (
    <div className="mt-4 flex flex-col gap-8 border-t border-border/50 pt-8">
      <SectionHeading>Your Action Plan</SectionHeading>

      {plan.nextMoves.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListChecks className="h-4 w-4 text-brand" />
            Your next moves
          </div>
          <div className="flex flex-col gap-2">
            {plan.nextMoves.map((move, index) => (
              <div
                key={move}
                className="flex gap-3 rounded-xl border border-border bg-card/60 p-4 text-[15px] leading-relaxed text-foreground/85"
              >
                <span className="shrink-0 font-bold tabular-nums text-brand">
                  {index + 1}
                </span>
                <span>{move}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.unknowns.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            Unknowns to close
          </div>
          <div className="flex flex-col gap-2">
            {plan.unknowns.map((unknown) => (
              <div
                key={unknown}
                className="flex gap-3 rounded-xl border border-border bg-card/60 p-4 text-[15px] leading-relaxed text-foreground/85"
              >
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                <span>{unknown}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.experiments.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FlaskConical className="h-4 w-4 text-emerald-400" />
            Validate before building
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.experiments.map((experiment) => (
              <div
                key={experiment.title}
                className="flex flex-col gap-1.5 rounded-xl border border-border bg-card/60 p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  {experiment.title}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground/80">
                  {experiment.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.interviewQuestions.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessagesSquare className="h-4 w-4 text-brand" />
            Talk to customers
          </div>
          <div className="flex flex-col gap-2">
            {plan.interviewQuestions.map((question) => (
              <div
                key={question}
                className="flex gap-3 rounded-xl border border-border bg-card/60 p-4 text-[15px] leading-relaxed text-foreground/85"
              >
                <span className="shrink-0 font-semibold text-muted-foreground/40">
                  &ldquo;
                </span>
                <span>{question}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 border-t border-border/50 pt-8">
        <Button
          onClick={handleGenerateWorkspace}
          disabled={!title.trim()}
          className="gap-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          Generate workspace
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground/55">
          Turns this plan into a workspace with tasks ready to go.
        </p>
      </div>
    </div>
  );
}
