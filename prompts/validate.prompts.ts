import type { Idea } from '@/types';

type ChatMessage = { role: 'system' | 'user'; content: string };

export function buildValidateMessages(idea: Idea): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are a startup idea validator. Analyze a digital product idea and return a validation report as valid JSON:
{
  "score": <integer 1–100>,
  "signals": ["positive signal 1", "positive signal 2", "positive signal 3"],
  "risks": ["risk or red flag 1", "risk or red flag 2"],
  "verdict": "1–2 sentence honest assessment of viability."
}
Be honest, specific, and grounded. Score reflects overall viability.
Respond ONLY with valid JSON. No markdown.`,
    },
    {
      role: 'user',
      content: `Validate this idea:
Title: ${idea.title}
Pitch: ${idea.pitch}
Audience: ${idea.audience}
Problem: ${idea.problem}
Differentiation: ${idea.differentiation}
Demand: ${idea.marketDemand} | Competition: ${idea.competitionLevel} | Difficulty: ${idea.difficulty}`,
    },
  ];
}
