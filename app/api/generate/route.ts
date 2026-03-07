import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type { GenerateRequest, GenerateResponse, Idea } from "@/types";

export async function POST(req: NextRequest) {
  let body: GenerateRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { prompt, productType, difficulty } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const filters: string[] = [];
  if (productType) filters.push(`product type: ${productType}`);
  if (difficulty) filters.push(`difficulty: ${difficulty}`);
  const filterLine = filters.length
    ? `\nAdditional constraints: ${filters.join(", ")}.`
    : "";

  const systemPrompt = `You are an expert startup idea generator specializing in developer tools, SaaS products, AI tools, and Chrome extensions.
Your task: generate exactly 3 distinct, actionable startup ideas based on the user's skills and interests.
Each idea must be realistic to build as a solo developer or small team.

Respond ONLY with a valid JSON array of exactly 3 objects matching this schema:
[
  {
    "title": "Short catchy product name — tagline",
    "description": "2-3 sentences describing what the product does and its core value prop.",
    "problem": "One sentence describing the specific pain point this solves.",
    "audience": "One sentence describing the target user.",
    "tags": ["Tag1", "Tag2"],
    "difficulty": "Easy" | "Medium" | "Hard"
  }
]

Rules:
- tags must be chosen from: SaaS, AI Tool, Chrome Extension, Dev Tool, Mobile App, Marketplace, API
- difficulty reflects the estimated build complexity for a solo developer
- No markdown, no explanation, no wrapper object — just the raw JSON array`;

  const userMessage = `My skills / context: ${prompt.trim()}${filterLine}

Generate 3 startup ideas for me.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.85,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // The model may wrap in { "ideas": [...] } or return a bare array
    let ideas: Idea[];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      ideas = parsed;
    } else if (Array.isArray(parsed.ideas)) {
      ideas = parsed.ideas;
    } else {
      // Try to find any array value in the top-level object
      const firstArray = Object.values(parsed).find(Array.isArray) as Idea[] | undefined;
      if (!firstArray) throw new Error("Unexpected response shape from OpenAI");
      ideas = firstArray;
    }

    const response: GenerateResponse = { ideas: ideas.slice(0, 3) };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: "Failed to generate ideas. Please try again." },
      { status: 500 }
    );
  }
}
