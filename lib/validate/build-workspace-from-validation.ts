import { scoreTier } from '@/lib/validate/score-tier';
import type { ActionPlan, PainEvidenceResult } from '@/lib/schemas';
import type { Idea, SignalLevel } from '@/types';
import type { NewTask } from '@/types/workspace.types';

// Maps the score band to a coarse demand signal for the synthesized idea.
function demandFromScore(score: number | undefined): SignalLevel {
  if (score == null) return 'Medium';
  const tier = scoreTier(score);
  if (tier === 'strong') return 'High';
  if (tier === 'promising') return 'Medium';
  return 'Low';
}

function competitionFromCount(count: number): SignalLevel {
  if (count >= 3) return 'High';
  if (count >= 1) return 'Medium';
  return 'Low';
}

// Synthesizes a minimal but valid Idea from a validation report so it can seed a
// workspace. The workspace UI only reads title/problem/pitch/audience; the other
// required fields are filled with safe defaults.
export function buildIdeaFromValidation(
  result: PainEvidenceResult,
  title: string
): Idea {
  return {
    title,
    pitch: result.summary,
    audience: '',
    problem: result.problem,
    gap: '',
    differentiation: '',
    closestCompetitors: result.competitors?.map((c) => c.name) ?? [],
    mvpFeatures: [],
    mvpRoadmap: [],
    techStack: [],
    firstUsers: [],
    difficulty: 'Medium',
    marketDemand: demandFromScore(result.score),
    competitionLevel: competitionFromCount(result.competitors?.length ?? 0),
    monetizationPotential: 'Medium',
    confidence: result.score ?? 50,
  };
}

// Turns the action plan into seed tasks for the workspace Todo board.
export function buildWorkspaceTasks(plan: ActionPlan): NewTask[] {
  const tasks: NewTask[] = [];

  plan.nextMoves.forEach((move) => {
    tasks.push({ title: move, status: 'todo', priority: 'high' });
  });

  plan.experiments.forEach((experiment) => {
    tasks.push({
      title: experiment.title,
      description: experiment.description,
      status: 'todo',
      priority: 'medium',
    });
  });

  plan.unknowns.forEach((unknown) => {
    tasks.push({ title: `Resolve: ${unknown}`, status: 'todo', priority: 'low' });
  });

  if (plan.interviewQuestions.length > 0) {
    tasks.push({
      title: 'Interview customers',
      description: plan.interviewQuestions.map((q) => `• ${q}`).join('\n'),
      status: 'todo',
      priority: 'high',
    });
  }

  return tasks;
}
