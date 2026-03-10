'use client';

import { useMutation } from '@tanstack/react-query';
import { validateIdea } from '@/services/idea.service';
import type { Idea, ValidationResult } from '@/types';

/**
 * Typed mutation for POST /api/validate.
 *
 * Variables : Idea             (full idea object to score)
 * Data      : ValidationResult (score, signals, risks, verdict)
 * Error     : Error
 */
export function useValidateMutation() {
  return useMutation<ValidationResult, Error, Idea>({
    mutationFn: validateIdea,
  });
}
