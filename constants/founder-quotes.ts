export const FOUNDER_QUOTES = [
  'Make something people want. - Y Combinator',
  'Fall in love with the problem, not the solution.',
  "If you're not embarrassed by the first version, you launched too late. - Reid Hoffman",
  'Do things that don’t scale. - Paul Graham',
  'Build something 100 people love, not something a million people kind of like. - Sam Altman',
  'Ideas are cheap. Execution is everything.',
  'Talk to your users. Then talk to them again.',
  'Speed is a founder’s superpower.',
  'A startup is a bet on a problem worth solving.',
  'Start before you feel ready.',
  'The best way to predict the future is to build it.',
  'Founders don’t need all the answers - just better questions.',
] as const;

export function randomFounderQuote(): string {
  return FOUNDER_QUOTES[Math.floor(Math.random() * FOUNDER_QUOTES.length)];
}
