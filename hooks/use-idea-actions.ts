'use client';

import { useEffect, useState } from 'react';
import type { Idea, ValidationResult } from '@/types';
import { useValidateMutation } from '@/hooks/mutations/use-validate-mutation';
import { useRefineMutation } from '@/hooks/mutations/use-refine-mutation';

export interface UseIdeaActionsReturn {
  displayIdea: Idea | null;
  validation: ValidationResult | null;
  refining: boolean;
  validating: boolean;
  refine: (instruction: string) => void;
  validate: () => void;
  clearValidation: () => void;
}

// The useEffect here is state synchronisation, not data fetching — it keeps
// displayIdea in sync when the user opens a different card in the modal.
export function useIdeaActions(idea: Idea | null): UseIdeaActionsReturn {
  const [displayIdea, setDisplayIdea] = useState<Idea | null>(idea);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const validateMutation = useValidateMutation();
  const refineMutation = useRefineMutation();

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
      }
    );
  }

  return {
    displayIdea,
    validation,
    refining: refineMutation.isPending,
    validating: validateMutation.isPending,
    refine,
    validate,
    clearValidation: () => setValidation(null),
  };
}
