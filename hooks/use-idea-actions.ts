"use client";

import { useEffect, useState } from "react";
import type { Idea, ValidationResult } from "@/types";
import { useValidateMutation } from "@/hooks/mutations/use-validate-mutation";
import { useRefineMutation } from "@/hooks/mutations/use-refine-mutation";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseIdeaActionsReturn {
  displayIdea:    Idea | null;
  validation:     ValidationResult | null;
  // Loading states derived from mutation.isPending — no separate useState
  refining:       boolean;
  validating:     boolean;
  // Actions — synchronous callers; mutations manage their own async lifecycle
  refine:         (instruction: string) => void;
  validate:       () => void;
  clearValidation:() => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages idea refinement and validation for the OpportunityModal.
 *
 * `refining` and `validating` are derived from TanStack Query's `isPending`
 * flag — no manual boolean state needed. Error handling is managed by the
 * mutation objects (accessible via `refineMutation.error` etc. if needed).
 *
 * The `useEffect` here is intentional — it synchronises the displayed idea
 * when the user opens a different card. This is state synchronisation, not
 * data fetching, so it is not a candidate for TanStack Query.
 */
export function useIdeaActions(idea: Idea | null): UseIdeaActionsReturn {
  const [displayIdea, setDisplayIdea] = useState<Idea | null>(idea);
  const [validation,  setValidation]  = useState<ValidationResult | null>(null);

  const validateMutation = useValidateMutation();
  const refineMutation   = useRefineMutation();

  // Sync local display state when the selected idea changes, and reset
  // any stale mutation state from the previous idea.
  useEffect(() => {
    setDisplayIdea(idea);
    setValidation(null);
    validateMutation.reset();
    refineMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea]);

  function validate(): void {
    if (!displayIdea) return;
    validateMutation.mutate(displayIdea, {
      onSuccess: (result) => setValidation(result),
    });
  }

  function refine(instruction: string): void {
    if (!displayIdea) return;
    refineMutation.mutate(
      { idea: displayIdea, instruction },
      {
        onSuccess: (refined) => {
          setDisplayIdea(refined);
          setValidation(null);
        },
      },
    );
  }

  return {
    displayIdea,
    validation,
    // isPending is TanStack Query's canonical loading flag for mutations
    refining:  refineMutation.isPending,
    validating: validateMutation.isPending,
    refine,
    validate,
    clearValidation: () => setValidation(null),
  };
}
