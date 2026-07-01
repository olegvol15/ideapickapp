import { truncateAtWord } from '@/lib/evidence/quote-pool';
import type { PainEvidenceResult } from '@/lib/schemas';

const MAX_THEMES = 5;
const MAX_QUOTES = 3;
const MAX_COMPETITORS = 4;

// Compact, plain-text summary of the gathered evidence, fed to Idy so the
// critique can cite the real score, complaints, and competitors instead of
// speaking in generalities.
export function buildEvidenceDigest(
  result: PainEvidenceResult,
  audienceProvided: boolean
): string {
  const lines: string[] = [];

  lines.push(`Problem we searched for: "${result.problem}"`);

  if (result.score != null && result.scoreBreakdown) {
    const b = result.scoreBreakdown;
    lines.push(
      `Idea score: ${result.score}/100 (problem strength ${b.problemStrength}, ` +
        `complaint frequency ${b.complaintFrequency}, audience reach ${b.audienceReachability}).`
    );
  }
  if (!audienceProvided) {
    lines.push('The founder did not specify a target audience.');
  }

  const complaintThemes = result.themes.filter(
    (t) => t.evidenceType !== 'related'
  );
  const relatedThemes = result.themes.filter(
    (t) => t.evidenceType === 'related'
  );
  lines.push(
    `Evidence found: ${result.totalQuotes} excerpts reviewed, ` +
      `${complaintThemes.length} direct-complaint theme(s), ${relatedThemes.length} related theme(s).`
  );

  if (result.themes.length > 0) {
    const themeList = result.themes
      .slice(0, MAX_THEMES)
      .map(
        (t) =>
          `- "${t.label}" (${t.mentionCount} mention${t.mentionCount !== 1 ? 's' : ''}, ${t.evidenceType ?? 'complaint'})`
      )
      .join('\n');
    lines.push(`Top complaint themes:\n${themeList}`);
  } else {
    lines.push('No complaint themes were found — direct demand evidence is weak.');
  }

  const quotes = complaintThemes
    .flatMap((t) => t.quotes)
    .slice(0, MAX_QUOTES)
    .map((q) => `- "${truncateAtWord(q.text, 220)}" (${q.sourceLabel})`);
  if (quotes.length > 0) {
    lines.push(`Representative complaints:\n${quotes.join('\n')}`);
  }

  const competitors = result.competitors ?? [];
  if (competitors.length > 0) {
    const compList = competitors
      .slice(0, MAX_COMPETITORS)
      .map((c) => {
        const dislike = c.dislikes[0]?.text;
        return dislike ? `- ${c.name} (users dislike: ${dislike})` : `- ${c.name}`;
      })
      .join('\n');
    lines.push(`Existing competitors found:\n${compList}`);
  } else {
    lines.push('No established competitors were surfaced in search.');
  }

  return lines.join('\n');
}

const MAX_DISLIKES_PER_COMPETITOR = 4;

// How crowded the market looks, in words, from the 0–100 saturation level.
function saturationPhrase(marketSaturation: number): string {
  if (marketSaturation >= 70) {
    return 'The market is crowded with entrenched incumbents.';
  }
  if (marketSaturation >= 40) {
    return 'The market is moderately contested.';
  }
  return 'The market is wide open — few entrenched players.';
}

// Focused digest for the opportunity-gap synthesis: the saturation level plus
// EVERY competitor dislike (buildEvidenceDigest only carries the first). Returns
// an empty string when no competitor has dislikes, so the caller can skip the
// LLM call — there is no gap to synthesize without incumbent grievances.
export function buildOpportunityGapDigest(result: PainEvidenceResult): string {
  const competitors = (result.competitors ?? []).filter(
    (c) => c.dislikes.length > 0
  );
  if (competitors.length === 0) return '';

  const lines: string[] = [];
  lines.push(`Problem we searched for: "${result.problem}"`);

  const saturation = result.scoreBreakdown?.marketSaturation;
  if (saturation != null) {
    lines.push(`Market saturation: ${saturation}/100. ${saturationPhrase(saturation)}`);
  }

  const compList = competitors
    .slice(0, MAX_COMPETITORS)
    .map((c) => {
      const dislikes = c.dislikes
        .slice(0, MAX_DISLIKES_PER_COMPETITOR)
        .map((d) => `  - ${truncateAtWord(d.text, 160)}`)
        .join('\n');
      return `${c.name} — users dislike:\n${dislikes}`;
    })
    .join('\n');
  lines.push(`Incumbents and their weaknesses:\n${compList}`);

  return lines.join('\n');
}
