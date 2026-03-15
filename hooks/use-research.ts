'use client';

import {
  useResearchStore,
  type PersistedResearch,
} from '@/stores/research.store';
import { useGenerate, useSaveGeneration } from '@/hooks/use-generations';
import { getApiMessage } from '@/lib/errors/api-error';

const THINKING_DELAY_MS = 800;
const CARD_STAGGER_MS = 380;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useResearch(userId: string | undefined) {
  const store = useResearchStore();
  const generateMutation = useGenerate();
  const saveGenerationMutation = useSaveGeneration(userId);

  const isGenerating =
    store.phase === 'thinking' ||
    store.phase === 'generating' ||
    store.phase === 'streaming';

  async function handleGenerate(): Promise<void> {
    const { prompt, productType, difficulty } = useResearchStore.getState();
    if (!prompt.trim() || isGenerating) return;

    generateMutation.reset();
    store.setPhase('thinking');
    store.setVisibleCount(0);
    store.setResult(null, null);
    await wait(THINKING_DELAY_MS);

    store.setPhase('generating');

    let data;
    try {
      data = await generateMutation.mutateAsync({
        prompt,
        productType,
        difficulty,
      });
    } catch {
      store.setPhase('error');
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
    generateMutation.reset();
    store.clear();
  }

  return {
    handleGenerate,
    handleClear,
    isGenerating,
    errorMsg: getApiMessage(generateMutation.error),
  };
}
