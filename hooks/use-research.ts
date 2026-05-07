'use client';

import { useRef, startTransition } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  useResearchStore,
  type PersistedResearch,
} from '@/stores/research.store';
import { useSaveGeneration } from '@/hooks/use-generations';
import { generateIdeasStream } from '@/services/generate.service';
import { wait } from '@/lib/utils';
import type { GenerateResponse, ProductType, Difficulty } from '@/types';

export function useResearch(userId: string | undefined) {
  const store = useResearchStore();
  const saveGenerationMutation = useSaveGeneration(userId);
  const abortRef = useRef<AbortController | null>(null);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGenerating =
    store.phase === 'thinking' ||
    store.phase === 'generating' ||
    store.phase === 'streaming';

  const generateMutation = useMutation<
    GenerateResponse,
    Error & { status?: number },
    { prompt: string; productType: ProductType | ''; difficulty: Difficulty | ''; signal: AbortSignal }
  >({
    mutationFn: async (vars) => {
      const cycleMessages = [
        'Mapping the competitive landscape…',
        'Identifying market opportunities…',
        'Crafting product ideas…',
        'Scoring difficulty and demand…',
        'Almost there…',
      ];
      store.setPhase('generating');
      startTransition(() => store.setStatusLabel('Searching the market…'));
      return generateIdeasStream(
        { prompt: vars.prompt, productType: vars.productType, difficulty: vars.difficulty },
        {
          signal: vars.signal,
          onCompetitors: (competitors) => {
            const msg =
              competitors.length > 0
                ? `Found ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''}, analyzing gaps…`
                : 'Analyzing the market…';
            startTransition(() => store.setStatusLabel(msg));
            let idx = 0;
            analysisIntervalRef.current = setInterval(() => {
              startTransition(() => store.setStatusLabel(cycleMessages[idx]));
              idx = Math.min(idx + 1, cycleMessages.length - 1);
            }, 3500);
          },
        }
      );
    },
    onSuccess: async (data, vars) => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      store.setResult(data, null);

      const savedId = await saveGenerationMutation
        .mutateAsync({
          prompt: vars.prompt,
          productType: vars.productType,
          difficulty: vars.difficulty,
          result: data,
        })
        .catch(() => null);

      if (savedId) store.setResult(data, savedId);

      const entry: PersistedResearch = {
        prompt: vars.prompt,
        productType: vars.productType,
        difficulty: vars.difficulty,
        result: data,
        generationId: savedId,
        createdAt: Date.now(),
      };
      store.pushLocalHistory(entry);

      store.setPhase('streaming');
      for (let i = 0; i < data.ideas.length; i++) {
        if (i > 0) await wait(380);
        store.setVisibleCount(i + 1);
      }
      store.setPhase('done');
    },
    onError: (err) => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      if (err.name === 'AbortError') return;
      if (!userId && err.status === 429) {
        store.setPhase('idle');
        store.setGuestRateLimited(true);
        return;
      }
      store.setPhase('error');
      store.setErrorMessage(err.message ?? 'Something went wrong');
    },
    retry: false,
  });

  function handleGenerate(): void {
    const { prompt, productType, difficulty } = useResearchStore.getState();
    if (!prompt.trim() || generateMutation.isPending) return;

    abortRef.current?.abort();
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    const abort = new AbortController();
    abortRef.current = abort;

    store.setPhase('thinking');
    store.setStatusLabel('');
    store.setErrorMessage(null);
    store.setVisibleCount(0);
    store.setResult(null, null);

    wait(800).then(() => {
      if (abort.signal.aborted) return;
      generateMutation.mutate({ prompt, productType, difficulty, signal: abort.signal });
    });
  }

  function handleCancel(): void {
    abortRef.current?.abort();
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    const { result } = useResearchStore.getState();
    store.setPhase(result ? 'done' : 'idle');
  }

  function handleClear(): void {
    abortRef.current?.abort();
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    store.clear();
  }

  return {
    handleGenerate,
    handleCancel,
    handleClear,
    isGenerating,
    errorMsg: store.errorMessage ?? 'Something went wrong',
  };
}
