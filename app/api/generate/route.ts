import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { searchAll } from "@/lib/search";
import { buildQueryGenerationMessages, buildAnalysisMessages } from "@/lib/prompts";
import type { GenerateRequest, GenerateResponse } from "@/types";

export async function POST(req: NextRequest) {
  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { prompt, productType = "", difficulty = "" } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    // Step 1: Generate focused search queries from the user prompt
    const queryCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: buildQueryGenerationMessages(prompt, productType),
      temperature: 0.4,
      max_tokens: 100,
      response_format: { type: "json_object" },
    });

    const { queries = [] }: { queries: string[] } = JSON.parse(
      queryCompletion.choices[0]?.message?.content ?? "{}"
    );

    // Step 2: Run all queries through Tavily in parallel, deduplicate by URL
    const competitors = await searchAll(queries.slice(0, 3));

    // Step 3: Analyze landscape + generate grounded ideas
    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: buildAnalysisMessages(prompt, competitors, productType, difficulty),
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const llmOutput = JSON.parse(
      analysisCompletion.choices[0]?.message?.content ?? ""
    );

    // Merge Tavily competitors into response (source of truth for the competitor list)
    const result: GenerateResponse = {
      ...llmOutput,
      competitors,
      marketContext: {
        ...llmOutput.marketContext,
        competitorsFound: competitors.length,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: "Failed to generate ideas. Please try again." },
      { status: 500 }
    );
  }
}
