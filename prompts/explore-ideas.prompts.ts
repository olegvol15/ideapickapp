type ChatMessage = { role: 'system' | 'user'; content: string };

export function buildExploreIdeasMessages(
  interest: string,
  constraints: string[],
  previousIdeas?: string[],
): ChatMessage[] {
  const avoidClause =
    previousIdeas && previousIdeas.length > 0
      ? `\nIMPORTANT: Generate ideas that are clearly different from these previous suggestions: ${previousIdeas.join(' | ')}`
      : '';

  return [
    {
      role: 'system',
      content: `You are a startup idea generator. Generate exactly 3 distinct product ideas.

Return JSON: { "ideas": [...] }

Each idea must have:
{
  "title": "<short, memorable product name (3-6 words)>",
  "description": "<one compelling sentence describing who it's for and what it does>",
  "score": <integer 0-100, real market opportunity>,
  "verdict": "<2-3 word UPPERCASE label: VIABLE | BUILD IT | STRONG SIGNAL | NICHE PLAY | NEEDS WORK>",
  "bullets": ["<concrete market signal>", "<concrete market signal>", "<concrete market signal>"],
  "nextStep": "<one specific, actionable next step>"
}

Rules:
- Generate exactly 3 clearly different ideas (no overlapping concepts)
- Each idea must genuinely reflect the stated constraints
- Score = real market opportunity, not enthusiasm
- Bullets = concrete market signals, not generic advice
- "Fast to build" → MVP completable in days/weeks
- "Solo dev friendly" → minimal ops, serverless-friendly
- "B2C" → direct consumer, self-serve acquisition
- "B2B" → sold to businesses, can be higher ticket${avoidClause}`,
    },
    {
      role: 'user',
      content: `Interest area: ${interest}\nConstraints: ${constraints.length > 0 ? constraints.join(', ') : 'none'}`,
    },
  ];
}
