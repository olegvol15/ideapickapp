'use client';

import { useMutation } from '@tanstack/react-query';
import type { Idea } from '@/types';
import { refineIdea } from '@/services/idea.service';
import { useIdeaDraftStore } from '@/stores/idea-draft.store';

export interface UseIdeaActionsReturn {
  displayIdea: Idea | null;
  refining: boolean;
  refine: (instruction: string) => void;
}

export function useIdeaActions(): UseIdeaActionsReturn {
  const { draft, applyRefinement } = useIdeaDraftStore();

  const refineMutation = useMutation<Idea, Error, { idea: Idea; instruction: string }>({
    mutationFn: ({ idea, instruction }) => refineIdea(idea, instruction),
    onSuccess: (refined) => applyRefinement(refined),
  });

  return {
    displayIdea: draft,
    refining: refineMutation.isPending,
    refine: (instruction) => {
      if (draft) refineMutation.mutate({ idea: draft, instruction });
    },
  };
}
