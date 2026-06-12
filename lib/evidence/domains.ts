// Domain classification shared by evidence collection (web-quotes) and
// scoring (score). Matching is suffix-based so subdomains are covered
// (borism.medium.com matches medium.com).

export function matchesDomainSuffix(
  host: string,
  domains: ReadonlySet<string>
): boolean {
  const clean = host.toLowerCase();
  if (domains.has(clean)) return true;
  for (const domain of domains) {
    if (clean.endsWith(`.${domain}`)) return true;
  }
  return false;
}

// Video/social platforms, APK mirrors, market-research PR — no quotable
// complaint text.
export const BLOCKED_DOMAINS: ReadonlySet<string> = new Set([
  'youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'apkpure.com',
  'apkmirror.com',
  'apk-dl.com',
  'grandviewresearch.com',
  'mordorintelligence.com',
  'marketsandmarkets.com',
  'technavio.com',
  'statista.com',
  'ibisworld.com',
  'globenewswire.com',
  'prnewswire.com',
  'businessresearchinsights.com',
  'verifiedmarketresearch.com',
  'alliedmarketresearch.com',
  'precedenceresearch.com',
  'straitsresearch.com',
]);

// Publications and blog platforms — articles about problems, not people
// experiencing them. Quora/HN/StackExchange/dev.to stay allowed: real
// people post there.
export const EDITORIAL_DOMAINS: ReadonlySet<string> = new Set([
  'medium.com',
  'substack.com',
  'nngroup.com',
  'smashingmagazine.com',
  'uxdesign.cc',
  'blogspot.com',
  'wordpress.com',
  'wix.com',
  'squarespace.com',
  'forbes.com',
  'businessinsider.com',
  'techcrunch.com',
  'cnet.com',
  'pcmag.com',
  'techradar.com',
  'tomsguide.com',
  'wikipedia.org',
]);

// Places with reachable audiences. Used by scoring: an editorial article
// is evidence, but not a community you can post in.
export const COMMUNITY_DOMAINS: ReadonlySet<string> = new Set([
  'quora.com',
  'stackoverflow.com',
  'stackexchange.com',
  'superuser.com',
  'serverfault.com',
  'news.ycombinator.com',
  'indiehackers.com',
  'producthunt.com',
  'dev.to',
  'lobste.rs',
  'discourse.org',
]);
