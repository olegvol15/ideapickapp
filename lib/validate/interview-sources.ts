import { COMMUNITY_DOMAINS, matchesDomainSuffix } from '@/lib/evidence/domains';
import type { PainEvidenceResult, PainQuote, PainTheme } from '@/lib/schemas';

export interface InterviewSource {
  kind: 'reddit' | 'web';
  // Community/place to reach: "r/fitness" | "news.ycombinator.com".
  label: string;
  // Where to go: subreddit page | app page | a representative article.
  url?: string;
  // Distinct complaints / reviewers / mentions found in this place.
  count: number;
  // Domain for the favicon avatar (mirrors PainQuoteItem's avatar logic).
  faviconDomain: string;
}

const MAX_SOURCES = 6;

interface SourceGroup extends InterviewSource {
  // True once any quote in this group came from a complaint theme, so
  // complaint-backed places outrank related-context ones on ties.
  fromComplaint: boolean;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function subreddit(quote: PainQuote): string | undefined {
  return quote.sourceLabel.match(/r\/([A-Za-z0-9_]+)/)?.[1];
}

// Stable per-place key + the display fields for that place. Returns null for
// quotes we can't act on — App Store reviewers can't be contacted, X surfaces
// creators/marketers rather than reachable complainers, and web quotes with no
// usable URL have nowhere to point.
function describe(
  quote: PainQuote
): { key: string; source: Omit<InterviewSource, 'count'> } | null {
  if (quote.source === 'appstore' || quote.source === 'x') return null;

  if (quote.source === 'reddit') {
    const sub = subreddit(quote);
    return sub
      ? {
          key: `reddit:${sub.toLowerCase()}`,
          source: {
            kind: 'reddit',
            label: `r/${sub}`,
            url: `https://www.reddit.com/r/${sub}/`,
            faviconDomain: 'reddit.com',
          },
        }
      : {
          key: 'reddit:_generic',
          source: { kind: 'reddit', label: 'Reddit', faviconDomain: 'reddit.com' },
        };
  }

  // Only web places with a reachable audience — mirror the score's community
  // test (lib/evidence/score.ts) so app stores, vendor homepages, and articles
  // don't show up as somewhere you can interview people.
  const domain = hostname(quote.url ?? '');
  if (!domain) return null;
  if (!quote.author && !matchesDomainSuffix(domain, COMMUNITY_DOMAINS)) {
    return null;
  }
  return {
    key: `web:${domain}`,
    source: { kind: 'web', label: domain, url: quote.url, faviconDomain: domain },
  };
}

// Real communities/places to interview, derived only from collected evidence —
// no fabricated suggestions. Aggregates every quote across themes, dedupes
// repeats, and ranks the busiest, complaint-backed places first.
export function buildInterviewSources(
  result: PainEvidenceResult
): InterviewSource[] {
  const groups = new Map<string, SourceGroup>();
  const seen = new Set<string>();

  result.themes.forEach((theme: PainTheme) => {
    const fromComplaint = theme.evidenceType !== 'related';

    theme.quotes.forEach((quote) => {
      const dedupeKey = `${quote.url ?? ''}|${quote.text}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      const described = describe(quote);
      if (!described) return;

      const existing = groups.get(described.key);
      if (existing) {
        existing.count += 1;
        existing.fromComplaint ||= fromComplaint;
        existing.url ??= described.source.url;
      } else {
        groups.set(described.key, {
          ...described.source,
          count: 1,
          fromComplaint,
        });
      }
    });
  });

  return [...groups.values()]
    .sort(
      (a, b) =>
        b.count - a.count ||
        Number(b.fromComplaint) - Number(a.fromComplaint) ||
        a.label.localeCompare(b.label)
    )
    .slice(0, MAX_SOURCES)
    .map(({ kind, label, url, count, faviconDomain }) => ({
      kind,
      label,
      url,
      count,
      faviconDomain,
    }));
}
