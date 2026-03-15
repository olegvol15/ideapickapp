import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { discoverCompetitors } from '@/lib/discovery/router';
import {
  buildQueryGenerationMessages,
  buildAnalysisMessages,
} from '@/prompts/generate.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { generateLimiter } from '@/lib/rate-limit';
import { validateGenerateInput } from '@/lib/validate-input';
import { GenerateLLMOutputSchema } from '@/lib/schemas';
import type { GenerateRequest, GenerateResponse } from '@/types';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await checkRateLimit(generateLimiter, user.id);
  if (rateLimitError) return rateLimitError;

  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { prompt, productType = '', difficulty = '' } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const inputError = validateGenerateInput(prompt, productType, difficulty);
  if (inputError) return inputError;

  try {
    // Step 1: Generate focused search queries
    const queryCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: buildQueryGenerationMessages(prompt, productType),
      temperature: 0.4,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    });

    const { queries = [] }: { queries: string[] } = JSON.parse(
      queryCompletion.choices[0]?.message?.content ?? '{}'
    );

    // Step 2: Discover competitors via product-type-aware strategy
    const competitors = await discoverCompetitors(
      queries.slice(0, 3),
      productType
    );

    // Step 3: Analyze landscape and generate 3 grounded ideas
    const analysisCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: buildAnalysisMessages(
        prompt,
        competitors,
        productType,
        difficulty
      ),
      temperature: 0.7,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
    });

    const parsed = GenerateLLMOutputSchema.safeParse(
      JSON.parse(analysisCompletion.choices[0]?.message?.content ?? '{}')
    );

    if (!parsed.success) {
      console.error('[/api/generate] invalid LLM output', parsed.error.flatten());
      return NextResponse.json(
        { error: 'Failed to generate ideas. Please try again.' },
        { status: 500 }
      );
    }

    const result: GenerateResponse = {
      ...parsed.data,
      competitors,
      marketContext: {
        ...parsed.data.marketContext,
        competitorsFound: competitors.length,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/generate]', err);
    return NextResponse.json(
      { error: 'Failed to generate ideas. Please try again.' },
      { status: 500 }
    );
  }
}
