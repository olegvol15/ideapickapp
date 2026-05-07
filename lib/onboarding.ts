import type { ExploreIdea, Idea, SignalLevel, QuickValidateResponse } from '@/types';

export async function quickValidateApi(params: {
  description: string;
  audience: string;
  problem: string;
}): Promise<QuickValidateResponse> {
  const [res] = await Promise.all([
    fetch('/api/quick-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
    wait(3000),
  ]);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? 'Analysis failed.');
  }
  return res.json();
}

export async function exploreIdeasApi(params: {
  interest: string;
  previousTitles?: string[];
}): Promise<ExploreIdea[]> {
  const [res] = await Promise.all([
    fetch('/api/explore-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interest: params.interest,
        constraints: [],
        ...(params.previousTitles?.length ? { previousIdeas: params.previousTitles } : {}),
      }),
    }),
    wait(3000),
  ]);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? 'Exploration failed.');
  }
  const data = await res.json();
  return (data.ideas ?? []) as ExploreIdea[];
}

export function verdictColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 55) return '#0077b6';
  if (score >= 35) return '#f59e0b';
  return '#ef4444';
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function exploreIdeaToIdea(idea: ExploreIdea): Idea {
  const demand: SignalLevel = idea.score >= 65 ? 'High' : idea.score >= 40 ? 'Medium' : 'Low';
  const competition: SignalLevel = idea.score >= 65 ? 'Low' : idea.score >= 40 ? 'Medium' : 'High';
  return {
    title: idea.title,
    pitch: idea.description,
    audience: '',
    problem: idea.bullets[0] ?? '',
    gap: idea.bullets[1] ?? '',
    differentiation: idea.bullets[2] ?? '',
    closestCompetitors: [],
    mvpFeatures: [],
    mvpRoadmap: [],
    techStack: [],
    firstUsers: [],
    difficulty: idea.score >= 65 ? 'Easy' : idea.score >= 40 ? 'Medium' : 'Hard',
    marketDemand: demand,
    competitionLevel: competition,
    monetizationPotential: demand,
    confidence: idea.score,
  };
}
