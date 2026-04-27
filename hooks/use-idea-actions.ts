'use client';

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
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

  const refineMutation = useMutation<
    Idea,
    Error,
    { idea: Idea; instruction: string }
  >({
    mutationFn: ({ idea, instruction }) => refineIdea(idea, instruction),
    onSuccess: (refined) => applyRefinement(refined),
    onError: (err) => {
      // The Axios interceptor already handles 401/403/429/500 with toasts/redirects.
      // Only toast here for validation errors and network failures.
      const status = axios.isAxiosError(err) ? err.response?.status : null;
      if (status === 401 || status === 403 || status === 429 || status === 500)
        return;
      toast.error('Refinement failed. Please try again.');
    },
  });

  return {
    displayIdea: draft,
    refining: refineMutation.isPending,
    refine: (instruction) => {
      if (draft) refineMutation.mutate({ idea: draft, instruction });
    },
  };
}
