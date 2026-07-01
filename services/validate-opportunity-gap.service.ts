import { openai } from '@/lib/openai';
import { buildOpportunityGapMessages } from '@/prompts/validate.prompts';
import { OpportunityGapLLMSchema } from '@/lib/schemas';
import type { OpportunityGap, PainEvidenceResult } from '@/lib/schemas';
import { buildOpportunityGapDigest } from '@/lib/validate/assessment-digest';

interface OpportunityGapParams {
  description: string;
  productType: string;
  audience?: string;
  problem?: string;
}

// Turns the market-saturation signal into an explicit "the opening incumbents
// leave" statement, synthesized only from the competitor dislikes we already
// mined. Non-critical: returns null on any failure — and skips the LLM call
// entirely when there are no incumbent weaknesses, since there is no gap to
// synthesize without them.
export async function generateOpportunityGap(
  params: OpportunityGapParams,
  result: PainEvidenceResult
): Promise<OpportunityGap | null> {
  try {
    const gapDigest = buildOpportunityGapDigest(result);
    if (!gapDigest) return null;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: buildOpportunityGapMessages({
        description: params.description,
        productType: params.productType,
        audience: params.audience,
        problem: params.problem,
        gapDigest,
      }),
      temperature: 0.4,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const parsed = OpportunityGapLLMSchema.safeParse(
      JSON.parse(completion.choices[0]?.message?.content ?? '{}')
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
