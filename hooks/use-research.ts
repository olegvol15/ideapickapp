"use client";

import { useState } from "react";
import type { GenerateResponse, ProductType, Difficulty } from "@/types";
import { useGenerateMutation } from "@/hooks/mutations/use-generate-mutation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResearchPhase =
  | "idle"
  | "thinking"
  | "generating"
  | "streaming"
  | "done"
  | "error";

export interface UseResearchReturn {
  // Form state
  prompt:        string;
  productType:   ProductType | "";
  difficulty:    Difficulty  | "";
  // Result state (derived from mutation)
  result:        GenerateResponse | null;
  errorMsg:      string;
  // Animation state
  phase:         ResearchPhase;
  visibleCount:  number;
  isGenerating:  boolean;
  // Actions
  setPrompt:      (v: string) => void;
  setProductType: (v: ProductType | "") => void;
  setDifficulty:  (v: Difficulty  | "") => void;
  handleGenerate: () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Deliberate delay before the API call — gives the "thinking" animation time to render. */
const THINKING_DELAY_MS = 800;

/** Stagger between each idea card appearing in the results. */
const CARD_STAGGER_MS = 380;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Orchestrates the full research flow:
 *
 * 1. Form input state (prompt, productType, difficulty)
 * 2. UX animation phase machine  (thinking → generating → streaming → done)
 * 3. Network call via useGenerateMutation (TanStack Query useMutation)
 *
 * `result` and `errorMsg` are derived directly from the mutation — no
 * separate useState for them.
 */
export function useResearch(): UseResearchReturn {
  const [prompt,       setPrompt]      = useState("");
  const [productType,  setProductType] = useState<ProductType | "">("");
  const [difficulty,   setDifficulty]  = useState<Difficulty  | "">("");
  const [phase,        setPhase]       = useState<ResearchPhase>("idle");
  const [visibleCount, setVisibleCount]= useState(0);

  const mutation = useGenerateMutation();

  const isGenerating =
    phase === "thinking" || phase === "generating" || phase === "streaming";

  async function handleGenerate(): Promise<void> {
    if (!prompt.trim() || isGenerating) return;

    // Reset mutation state from any previous run before starting a new one
    mutation.reset();
    setPhase("thinking");
    setVisibleCount(0);
    await wait(THINKING_DELAY_MS);

    setPhase("generating");

    let data: GenerateResponse;
    try {
      // mutateAsync throws on error, letting us keep the phase machine inline
      data = await mutation.mutateAsync({ prompt, productType, difficulty });
    } catch {
      // Error message is stored in mutation.error — we just set the phase
      setPhase("error");
      return;
    }

    // Staggered card reveal
    setPhase("streaming");
    for (let i = 0; i < data.ideas.length; i++) {
      if (i > 0) await wait(CARD_STAGGER_MS);
      setVisibleCount(i + 1);
    }

    setPhase("done");
  }

  return {
    prompt, productType, difficulty,
    // Derived from mutation — no separate state needed
    result:   mutation.data  ?? null,
    errorMsg: mutation.error?.message ?? "Something went wrong",
    phase, visibleCount, isGenerating,
    setPrompt, setProductType, setDifficulty, handleGenerate,
  };
}
