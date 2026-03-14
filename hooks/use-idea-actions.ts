'use client';

import { useMutation } from '@tanstack/react-query';
import type { Idea, ValidationResult } from '@/types';
import { validateIdea, refineIdea } from '@/services/idea.service';
import { useIdeaDraftStore } from '@/stores/idea-draft.store';

export interface UseIdeaActionsReturn {
  displayIdea: Idea | null;
  validation: ValidationResult | null;
  refining: boolean;
  validating: boolean;
  refine: (instruction: string) => void;
  validate: () => void;
  clearValidation: () => void;
}

export function useIdeaActions(): UseIdeaActionsReturn {
  const { draft, validation, applyRefinement, setValidation, clearValidation } =
    useIdeaDraftStore();

  const validateMutation = useMutation<ValidationResult, Error, Idea>({
    mutationFn: validateIdea,
    onSuccess: (result) => setValidation(result),
  });

  const refineMutation = useMutation<
    Idea,
    Error,
    { idea: Idea; instruction: string }
  >({
    mutationFn: ({ idea, instruction }) => refineIdea(idea, instruction),
    onSuccess: (refined) => applyRefinement(refined),
  });

  return {
    displayIdea: draft,
    validation,
    refining: refineMutation.isPending,
    validating: validateMutation.isPending,
    validate: () => {
      if (draft) validateMutation.mutate(draft);
    },
    refine: (instruction) => {
      if (draft) refineMutation.mutate({ idea: draft, instruction });
    },
    clearValidation,
  };
}
