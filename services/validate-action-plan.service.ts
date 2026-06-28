import { openai } from '@/lib/openai';
import { buildActionPlanMessages } from '@/prompts/validate.prompts';
import { ActionPlanLLMSchema } from '@/lib/schemas';
import type { ActionPlan, PainEvidenceResult } from '@/lib/schemas';
import { buildEvidenceDigest } from '@/lib/validate/assessment-digest';

interface ActionPlanParams {
  description: string;
  productType: string;
  audience?: string;
  problem?: string;
}

// Evidence-grounded action plan (verdict line, next moves, unknowns,
// validation experiments, interview questions) from a single LLM call. Reuses
// the same evidence digest Idy's assessment is built from. Non-critical:
// returns null on any failure so the report still renders without it.
export async function generateActionPlan(
  params: ActionPlanParams,
  result: PainEvidenceResult
): Promise<ActionPlan | null> {
  try {
    const evidenceDigest = buildEvidenceDigest(
      result,
      Boolean(params.audience?.trim())
    );
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: buildActionPlanMessages({
        description: params.description,
        productType: params.productType,
        audience: params.audience,
        problem: params.problem,
        evidenceDigest,
      }),
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    });

    const parsed = ActionPlanLLMSchema.safeParse(
      JSON.parse(completion.choices[0]?.message?.content ?? '{}')
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
