import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { buildValidateMessages } from "@/lib/prompts";
import type { Idea, ValidationResult } from "@/types";

export async function POST(req: NextRequest) {
  const { idea } = (await req.json()) as { idea: Idea };

  if (!idea) {
    return NextResponse.json({ error: "Missing idea" }, { status: 400 });
  }

  const messages = buildValidateMessages(idea);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const result = JSON.parse(raw) as ValidationResult;

  return NextResponse.json(result);
}
