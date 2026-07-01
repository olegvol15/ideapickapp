import type { PainEvidenceResult, PainQuote } from '@/lib/schemas';

// Willingness-to-pay signal: mine the quotes we already collected for buy
// intent — people who say they'd pay, already pay, or want to switch. Complaints
// prove pain; these prove a buyer. Deterministic phrase matching only, so the
// signal is grounded (no fabricated numbers), free (no LLM), and recomputable
// from any persisted report — mirrors lib/validate/evidence-confidence.ts.

export type WtpLevel = 'none' | 'weak' | 'strong';

export type WtpCategory = 'willingToPay' | 'currentlyPaying' | 'switchIntent';

export interface WtpBreakdown {
  // "I'd pay for…", "worth paying", "take my money".
  willingToPay: number;
  // "I currently pay for…", "we pay $X", "my subscription", "paid plan".
  currentlyPaying: number;
  // "I'd switch from…", "looking to replace", "cancelled … because".
  switchIntent: number;
}

export interface WtpSignal {
  // Distinct quotes with a buy signal (each counts once).
  count: number;
  breakdown: WtpBreakdown;
  // Best few matched quotes to show as cited evidence.
  examples: PainQuote[];
  level: WtpLevel;
}

const MAX_EXAMPLES = 3;
const STRONG_MIN_COUNT = 3;
const WEAK_BONUS = 4;
const STRONG_BONUS = 8;

// Ordered so the first matching category wins. Patterns are lowercase-only
// (text is normalised before testing) and hoisted per the js-hoist-regexp rule.
const CATEGORY_PATTERNS: Record<WtpCategory, RegExp[]> = {
  willingToPay: [
    // Require a modal so bare present-tense "we pay $X" falls through to
    // currentlyPaying (checked next), which is where it belongs.
    /\b(?:i|we)(?:'d| would| will)\s+(?:happily |gladly |definitely )?pay\b/,
    /\bhapp(?:y|ily) to pay\b/,
    /\bgladly pay\b/,
    /\bpay(?:ing)? good money\b/,
    /\bworth (?:paying|the money)\b/,
    /\btake my money\b/,
    /\bshut up and take\b/,
    /\b(?:i|we)(?:'d| would| will)\s+(?:gladly |happily )?buy\b/,
  ],
  currentlyPaying: [
    /\bi(?:'ve| have)? (?:currently |been )?pay(?:ing)? (?:for|\$)/,
    /\bi'?m (?:currently )?paying (?:for|\$)/,
    /\bwe (?:currently )?pay \$?\d/,
    /\b(?:my|our) subscription\b/,
    /\bi'?m (?:currently )?subscrib(?:ed|ing)\b/,
    /\bi subscribe to\b/,
    /\bpaid (?:plan|tier|version|subscription)\b/,
  ],
  switchIntent: [
    /\b(?:i|we)(?:'d| would)?\s+(?:want to |love to )?switch(?:ed|ing)? (?:from|to|away)/,
    /\b(?:looking|want) to replace\b/,
    /\bmoved (?:from|to)\b.*\b(?:because|instead)\b/,
    /\bcancel(?:led|ing)? (?:my|our)\b.*\bbecause\b/,
  ],
};

const ORDERED_CATEGORIES: WtpCategory[] = [
  'willingToPay',
  'currentlyPaying',
  'switchIntent',
];

// A quote that mentions paying only to dismiss it is not a buy signal. Guards
// run before category matching so "I wouldn't pay for this" never counts.
const NEGATION_GUARDS: RegExp[] = [
  /\b(?:wouldn'?t|won'?t|would never|not (?:going to|gonna)) (?:pay|buy)\b/,
  /\bno ?one would (?:pay|buy)\b/,
  /\bnever (?:going to |gonna )?(?:pay|buy)\b/,
  /\b(?:not|isn'?t|aren'?t|wasn'?t) worth (?:paying|the money)\b/,
  /\brefuse to pay\b/,
];

function matchCategory(text: string): WtpCategory | null {
  if (NEGATION_GUARDS.some((guard) => guard.test(text))) return null;
  for (const category of ORDERED_CATEGORIES) {
    if (CATEGORY_PATTERNS[category].some((pattern) => pattern.test(text))) {
      return category;
    }
  }
  return null;
}

// App Store reviews carry a rating and severe complaints carry higher intensity;
// both make a buy signal more credible, so they sort to the front of examples.
function exampleWeight(quote: PainQuote): number {
  return (quote.rating ?? 0) + (quote.intensity ?? 0);
}

export function computeWtpSignal(result: PainEvidenceResult): WtpSignal {
  const breakdown: WtpBreakdown = {
    willingToPay: 0,
    currentlyPaying: 0,
    switchIntent: 0,
  };
  const matched: PainQuote[] = [];
  const seenText = new Set<string>();
  const sourceLabels = new Set<string>();
  const usedCategories = new Set<WtpCategory>();

  for (const theme of result.themes) {
    for (const quote of theme.quotes) {
      const normalized = quote.text.toLowerCase();
      const category = matchCategory(normalized);
      if (!category) continue;

      breakdown[category] += 1;
      usedCategories.add(category);
      sourceLabels.add(quote.sourceLabel);

      const key = normalized.slice(0, 80);
      if (!seenText.has(key)) {
        seenText.add(key);
        matched.push(quote);
      }
    }
  }

  const count = breakdown.willingToPay + breakdown.currentlyPaying + breakdown.switchIntent;
  const examples = [...matched]
    .sort((a, b) => exampleWeight(b) - exampleWeight(a))
    .slice(0, MAX_EXAMPLES);

  const level = computeLevel(count, usedCategories.size, sourceLabels.size);

  return { count, breakdown, examples, level };
}

// Strong needs corroboration — several signals spread across categories or
// sources — so a single loud thread can't overstate demand. Matches the
// conservative, points-style thresholds in evidence-confidence.ts.
function computeLevel(
  count: number,
  categories: number,
  distinctSources: number
): WtpLevel {
  if (count >= STRONG_MIN_COUNT && (categories >= 2 || distinctSources >= 2)) {
    return 'strong';
  }
  if (count >= 1) return 'weak';
  return 'none';
}

// Capped nudge to the Idea Score — buy intent is strong demand evidence, but a
// bonus, not a weighted pillar, so it can never dominate the 40/35/25 split.
export function wtpBonus(signal: WtpSignal): number {
  if (signal.level === 'strong') return STRONG_BONUS;
  if (signal.level === 'weak') return WEAK_BONUS;
  return 0;
}

// 0–100 stat for the score breakdown display. The real score effect is the
// capped bonus above; this only communicates the signal's strength.
export function wtpSignalStat(level: WtpLevel): number {
  if (level === 'strong') return 100;
  if (level === 'weak') return 50;
  return 0;
}
