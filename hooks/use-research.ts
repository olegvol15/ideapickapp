'use client';

import { useRef } from 'react';
import {
  useResearchStore,
  type PersistedResearch,
} from '@/stores/research.store';
import { useSaveGeneration } from '@/hooks/use-generations';
import { generateIdeasStream } from '@/services/generate.service';

const THINKING_DELAY_MS = 800;
const CARD_STAGGER_MS = 380;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useResearch(userId: string | undefined) {
  const store = useResearchStore();
  const saveGenerationMutation = useSaveGeneration(userId);
  const abortRef = useRef<AbortController | null>(null);

  const isGenerating =
    store.phase === 'thinking' ||
    store.phase === 'generating' ||
    store.phase === 'streaming';

  async function handleGenerate(): Promise<void> {
    const { prompt, productType, difficulty } = useResearchStore.getState();
    if (!prompt.trim() || isGenerating) return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    store.setPhase('thinking');
    store.setStatusLabel('');
    store.setErrorMessage(null);
    store.setVisibleCount(0);
    store.setResult(null, null);
    await wait(THINKING_DELAY_MS);

    store.setPhase('generating');
    store.setStatusLabel('Searching the market…');

    let data;
    try {
      data = await generateIdeasStream(
        { prompt, productType, difficulty },
        {
          signal: abort.signal,
          onCompetitors: (competitors) => {
            store.setStatusLabel(
              competitors.length > 0
                ? `Found ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''}, generating ideas…`
                : 'Analyzing the market…'
            );
          },
        }
      );
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return;
      store.setPhase('error');
      store.setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong'
      );
      return;
    }

    store.setResult(data, null);

    const savedId = await saveGenerationMutation
      .mutateAsync({ prompt, productType, difficulty, result: data })
      .catch(() => null);

    if (savedId) store.setResult(data, savedId);

    const entry: PersistedResearch = {
      prompt,
      productType,
      difficulty,
      result: data,
      generationId: savedId,
      createdAt: Date.now(),
    };
    store.pushLocalHistory(entry);

    store.setPhase('streaming');
    for (let i = 0; i < data.ideas.length; i++) {
      if (i > 0) await wait(CARD_STAGGER_MS);
      store.setVisibleCount(i + 1);
    }

    store.setPhase('done');
  }

  function handleClear(): void {
    abortRef.current?.abort();
    store.clear();
  }

  return {
    handleGenerate,
    handleClear,
    isGenerating,
    errorMsg: store.errorMessage ?? 'Something went wrong',
  };
}
