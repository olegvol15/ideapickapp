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
import { withErrorHandling } from '@/lib/errors/api-handler';
import { AppError } from '@/lib/errors/app-error';
import type { GenerateRequest, GenerateResponse } from '@/types';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth();
  await checkRateLimit(generateLimiter, user.id);

  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    throw AppError.validation('Invalid request body');
  }

  const { prompt, productType = '', difficulty = '' } = body;

  if (!prompt?.trim()) {
    throw AppError.validation('Prompt is required');
  }

  validateGenerateInput(prompt, productType, difficulty);

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
    throw AppError.invalidAiResponse('Failed to generate ideas. Please try again.');
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
});
