import type { EnhancedValidationResult } from '@/lib/schemas';
import type { IdeaContext } from '@/types/validate.types';

export interface RedditPostTemplate {
  type: 'reddit-post';
  title: string;
  body: string;
}

export interface LandingPageTemplate {
  type: 'landing-page';
  headline: string;
  subheadline: string;
  bullets: [string, string, string];
  cta: string;
}

export interface InterviewsTemplate {
  type: 'interviews';
  questions: string[];
}

export type ActionTemplate =
  | RedditPostTemplate
  | LandingPageTemplate
  | InterviewsTemplate;

const SUPPORTED_TYPES = new Set(['reddit-post', 'landing-page', 'interviews']);

function truncate(text: string, words: number): string {
  return text.split(' ').slice(0, words).join(' ');
}

function firstSentence(text: string): string {
  const end = text.search(/[.!?]/);
  return end !== -1 ? text.slice(0, end + 1) : text;
}

export function buildRedditPostTemplate(
  result: EnhancedValidationResult,
  ideaCtx?: IdeaContext
): RedditPostTemplate {
  const gap = result.whereToWin?.[0]?.gap;
  const opportunity = result.whereToWin?.[0]?.opportunity;
  const signal = result.signals?.[0] ?? '';
  const audience = ideaCtx?.audience ?? 'people';
  const description = ideaCtx?.description ?? '';

  const title = opportunity
    ? `Does anyone else struggle with this? (Working on a solution for ${audience})`
    : `Question for ${audience}: how do you currently handle ${truncate(description, 8)}?`;

  const bodyParts: string[] = [];

  if (gap) {
    bodyParts.push(
      `I've been researching a problem that seems underserved: ${gap.toLowerCase()}. Existing tools don't seem to address this well for ${audience}.`
    );
  } else {
    bodyParts.push(
      `I've been looking into ${truncate(description, 12)} and noticed a potential gap in how ${audience} handle this today.`
    );
  }

  if (signal) {
    bodyParts.push(`From my research: ${signal.toLowerCase()}`);
  }

  if (opportunity) {
    bodyParts.push(`The angle I'm exploring: ${opportunity}`);
  }

  bodyParts.push(
    `Would love to hear from people actually dealing with this — how painful is it on a scale of 1–10? And what would a good solution need to do?`
  );

  return {
    type: 'reddit-post',
    title,
    body: bodyParts.join('\n\n'),
  };
}

export function buildLandingPageTemplate(
  result: EnhancedValidationResult,
  ideaCtx?: IdeaContext
): LandingPageTemplate {
  const description = ideaCtx?.description ?? '';
  const opportunity = result.whereToWin?.[0]?.opportunity ?? '';
  const signals = result.signals ?? [];
  const verdict = result.verdict ?? '';

  const headline = truncate(description, 10);

  const subheadline = opportunity
    ? firstSentence(opportunity)
    : firstSentence(verdict);

  const rawBullets = signals.slice(0, 3);
  const bullets: [string, string, string] = [
    rawBullets[0] ?? 'Real problem, underserved market',
    rawBullets[1] ?? 'Built for the people who need it most',
    rawBullets[2] ?? 'Simple, focused, no bloat',
  ];

  const nextStep = result.nextStep ?? '';
  const ctaMatch = nextStep.split(/[,—–]/)[0].trim();
  const cta = ctaMatch.length > 5 && ctaMatch.length < 40 ? ctaMatch : 'Join the waitlist';

  return {
    type: 'landing-page',
    headline,
    subheadline,
    bullets,
    cta,
  };
}

export function buildInterviewsTemplate(
  result: EnhancedValidationResult,
  ideaCtx?: IdeaContext
): InterviewsTemplate {
  const problem = ideaCtx?.problem ?? 'this problem';
  const audience = ideaCtx?.audience ?? 'users like you';
  const gap = result.whereToWin?.[0]?.gap ?? 'current solutions';
  const competitorWeakness = result.competitorInsights?.[0]?.weakness ?? 'existing tools';
  const wtpLevel = result.willingnessToPay?.level;

  const questions = [
    `Can you walk me through the last time you ran into ${problem}? What did you do?`,
    `How do you currently handle ${gap}? What's the most frustrating part?`,
    `Have you tried ${competitorWeakness}? What made you keep using it or stop?`,
    wtpLevel === 'high' || wtpLevel === 'medium'
      ? `If a tool solved this completely, what would you expect to pay for it monthly?`
      : `What would make you actually switch from your current approach — what's the threshold?`,
    `Who else on your team or in your network deals with this? Would they find this conversation useful?`,
  ];

  return {
    type: 'interviews',
    questions,
  };
}

export function buildActionTemplate(
  result: EnhancedValidationResult,
  ideaCtx?: IdeaContext
): ActionTemplate | null {
  const type = result.nextStepType;
  if (!type || !SUPPORTED_TYPES.has(type)) return null;

  if (type === 'reddit-post') return buildRedditPostTemplate(result, ideaCtx);
  if (type === 'landing-page') return buildLandingPageTemplate(result, ideaCtx);
  if (type === 'interviews') return buildInterviewsTemplate(result, ideaCtx);

  return null;
}
