'use client';

import { useState } from 'react';
import type { GenerateResponse, ProductType, Difficulty } from '@/types';
import { useGenerateMutation } from '@/hooks/mutations/use-generate-mutation';
import { useAuth } from '@/context/auth';
import { saveGeneration } from '@/services/db.service';

export type ResearchPhase =
  | 'idle'
  | 'thinking'
  | 'generating'
  | 'streaming'
  | 'done'
  | 'error';

export interface UseResearchReturn {
  prompt:        string;
  productType:   ProductType | '';
  difficulty:    Difficulty  | '';
  result:        GenerateResponse | null;
  errorMsg:      string;
  phase:         ResearchPhase;
  visibleCount:  number;
  isGenerating:  boolean;
  generationId:  string | null;
  setPrompt:      (v: string) => void;
  setProductType: (v: ProductType | '') => void;
  setDifficulty:  (v: Difficulty  | '') => void;
  handleGenerate: () => Promise<void>;
}

// Deliberate pre-API delay so the "thinking" animation has time to render.
const THINKING_DELAY_MS = 800;
const CARD_STAGGER_MS   = 380;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useResearch(): UseResearchReturn {
  const { user } = useAuth();

  const [prompt,       setPrompt]      = useState('');
  const [productType,  setProductType] = useState<ProductType | ''>('');
  const [difficulty,   setDifficulty]  = useState<Difficulty  | ''>('');
  const [phase,        setPhase]       = useState<ResearchPhase>('idle');
  const [visibleCount, setVisibleCount]= useState(0);
  const [generationId, setGenerationId]= useState<string | null>(null);

  const mutation = useGenerateMutation();

  const isGenerating =
    phase === 'thinking' || phase === 'generating' || phase === 'streaming';

  async function handleGenerate(): Promise<void> {
    if (!prompt.trim() || isGenerating) return;

    mutation.reset();
    setPhase('thinking');
    setVisibleCount(0);
    setGenerationId(null);
    await wait(THINKING_DELAY_MS);

    setPhase('generating');

    let data: GenerateResponse;
    try {
      // mutateAsync throws on failure, keeping the phase machine linear.
      data = await mutation.mutateAsync({ prompt, productType, difficulty });
    } catch {
      setPhase('error');
      return;
    }

    // Persist the generation in the background if the user is logged in.
    if (user) {
      saveGeneration({ userId: user.id, prompt, productType, difficulty, result: data })
        .then((id) => {
          setGenerationId(id);
        });
    }

    setPhase('streaming');
    for (let i = 0; i < data.ideas.length; i++) {
      if (i > 0) await wait(CARD_STAGGER_MS);
      setVisibleCount(i + 1);
    }

    setPhase('done');
  }

  return {
    prompt, productType, difficulty,
    result:   mutation.data  ?? null,
    errorMsg: mutation.error?.message ?? 'Something went wrong',
    phase, visibleCount, isGenerating, generationId,
    setPrompt, setProductType, setDifficulty, handleGenerate,
  };
}
