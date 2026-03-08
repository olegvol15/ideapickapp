import { searchAll } from "@/lib/search";
import type { Competitor } from "@/types";

// ─── Pricing signal extraction ────────────────────────────────────────────────

function extractPricingSignal(snippet: string): string | undefined {
  const s = snippet.toLowerCase();

  if (s.includes("open-source") || s.includes("open source")) return "Open source";
  if (s.includes("self-hosted") || s.includes("self hosted")) return "Self-hosted";
  if (s.includes("freemium") || s.includes("free plan") || s.includes("free tier")) return "Freemium";

  const priceMatch = snippet.match(/\$\s*\d+(?:\.\d+)?\s*(?:\/\s*mo(?:nth)?|per\s+month)/i);
  if (priceMatch) return priceMatch[0].replace(/\s+/g, "");

  if (s.includes("per seat") || s.includes("per user") || s.includes("/user")) return "Per-seat";
  if (s.includes("free") && (s.includes("paid") || s.includes("pro") || s.includes("premium"))) return "Free + paid";
  if (s.includes("enterprise") && !s.includes("free")) return "Enterprise pricing";

  return undefined;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function discoverSaas(queries: string[]): Promise<Competitor[]> {
  const competitors = await searchAll(queries);
  return competitors.map((c) => ({
    ...c,
    platform: "Web" as const,
    pricingSignal: extractPricingSignal(c.snippet),
  }));
}
