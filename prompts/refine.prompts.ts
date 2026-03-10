import type { Idea } from '@/types';

type ChatMessage = { role: 'system' | 'user'; content: string };

export function buildRefineMessages(
  idea: Idea,
  instruction: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are a startup idea refinement assistant. You receive a digital product idea and a refinement instruction.
Return the refined idea as valid JSON using the EXACT same shape as the input — all fields must be present.
Only change fields relevant to the instruction. Keep unchanged fields identical.
Respond ONLY with valid JSON. No markdown, no explanation.`,
    },
    {
      role: 'user',
      content: `Refinement instruction: "${instruction}"

Current idea:
${JSON.stringify(idea, null, 2)}

Return the refined idea JSON.`,
    },
  ];
}
