'use client';

import { useMutation } from '@tanstack/react-query';
import { refineIdea } from '@/services/idea.service';
import type { Idea } from '@/types';

interface RefineVariables {
  idea: Idea;
  instruction: string;
}

/**
 * Typed mutation for POST /api/refine.
 *
 * Variables : RefineVariables  (idea + instruction preset)
 * Data      : Idea             (same shape, fields mutated per instruction)
 * Error     : Error
 */
export function useRefineMutation() {
  return useMutation<Idea, Error, RefineVariables>({
    mutationFn: ({ idea, instruction }) => refineIdea(idea, instruction),
  });
}
