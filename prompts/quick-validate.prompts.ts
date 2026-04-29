type ChatMessage = { role: 'system' | 'user'; content: string };

export function buildQuickValidateMessages(
  description: string,
  audience: string,
  problem: string,
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are a rapid market analyst. Evaluate a product idea and return a JSON verdict.

Return exactly this JSON:
{
  "verdict": "<2-3 word UPPERCASE label, one of: VIABLE | BUILD IT | STRONG SIGNAL | NEEDS WORK | HIGH RISK | PIVOT FIRST>",
  "score": <integer 0-100 representing real market opportunity>,
  "bullets": ["<concrete market signal>", "<concrete market signal>", "<concrete market signal>"],
  "nextStep": "<one specific, actionable next step, single sentence>"
}

Rules:
- Score reflects real market opportunity, not how interesting the idea sounds
- Bullets are concrete market signals, not generic advice
- Verdict must match the score: VIABLE/BUILD IT/STRONG SIGNAL (60+), NEEDS WORK (40-59), HIGH RISK/PIVOT FIRST (<40)
- Be honest and direct`,
    },
    {
      role: 'user',
      content: `Idea: ${description}\nTarget audience: ${audience}\nProblem solved: ${problem}`,
    },
  ];
}
