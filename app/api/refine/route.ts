import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { buildRefineMessages } from "@/lib/prompts";
import type { Idea } from "@/types";

export async function POST(req: NextRequest) {
  const { idea, instruction } = (await req.json()) as { idea: Idea; instruction: string };

  if (!idea || !instruction) {
    return NextResponse.json({ error: "Missing idea or instruction" }, { status: 400 });
  }

  const messages = buildRefineMessages(idea, instruction);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const refined = JSON.parse(raw) as Idea;

  return NextResponse.json(refined);
}
