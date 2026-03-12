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
  handleClear:    () => void;
}

const THINKING_DELAY_MS = 800;
const CARD_STAGGER_MS   = 380;

export const STORAGE_KEY  = 'ideapick:last-research';
export const HISTORY_KEY  = 'ideapick:research-history';
export const MAX_HISTORY  = 20;
export const HISTORY_EVENT = 'ideapick:history-updated';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface PersistedResearch {
  prompt:       string;
  productType:  ProductType | '';
  difficulty:   Difficulty  | '';
  result:       GenerateResponse;
  generationId: string | null;
  createdAt:    number;
}

export function loadStorage<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; }
  catch { return null; }
}

function save(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

export function pushHistory(entry: PersistedResearch): void {
  const history = loadStorage<PersistedResearch[]>(HISTORY_KEY) ?? [];
  // Remove duplicate prompt if already exists
  const deduped = history.filter((h) => h.prompt !== entry.prompt);
  save(HISTORY_KEY, [entry, ...deduped].slice(0, MAX_HISTORY));
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function useResearch(): UseResearchReturn {
  const { user } = useAuth();

  const persisted = loadStorage<PersistedResearch>(STORAGE_KEY);

  const [prompt,       setPrompt]      = useState(persisted?.prompt       ?? '');
  const [productType,  setProductType] = useState<ProductType | ''>(persisted?.productType ?? '');
  const [difficulty,   setDifficulty]  = useState<Difficulty  | ''>(persisted?.difficulty  ?? '');
  const [phase,        setPhase]       = useState<ResearchPhase>(persisted ? 'done' : 'idle');
  const [visibleCount, setVisibleCount]= useState(persisted?.result.ideas.length ?? 0);
  const [generationId, setGenerationId]= useState<string | null>(persisted?.generationId ?? null);
  const [result,       setResult]      = useState<GenerateResponse | null>(persisted?.result ?? null);

  const mutation = useGenerateMutation();

  const isGenerating =
    phase === 'thinking' || phase === 'generating' || phase === 'streaming';

  async function handleGenerate(): Promise<void> {
    if (!prompt.trim() || isGenerating) return;

    mutation.reset();
    setPhase('thinking');
    setVisibleCount(0);
    setGenerationId(null);
    setResult(null);
    await wait(THINKING_DELAY_MS);

    setPhase('generating');

    let data: GenerateResponse;
    try {
      data = await mutation.mutateAsync({ prompt, productType, difficulty });
    } catch {
      setPhase('error');
      return;
    }

    setResult(data);

    let savedId: string | null = null;
    if (user) {
      savedId = await saveGeneration({ userId: user.id, prompt, productType, difficulty, result: data })
        .catch(() => null);
      setGenerationId(savedId);
    }

    const entry: PersistedResearch = { prompt, productType, difficulty, result: data, generationId: savedId, createdAt: Date.now() };
    save(STORAGE_KEY, entry);
    pushHistory(entry);

    setPhase('streaming');
    for (let i = 0; i < data.ideas.length; i++) {
      if (i > 0) await wait(CARD_STAGGER_MS);
      setVisibleCount(i + 1);
    }

    setPhase('done');
  }

  function handleClear(): void {
    mutation.reset();
    setPrompt('');
    setProductType('');
    setDifficulty('');
    setResult(null);
    setPhase('idle');
    setVisibleCount(0);
    setGenerationId(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  return {
    prompt, productType, difficulty,
    result,
    errorMsg: mutation.error?.message ?? 'Something went wrong',
    phase, visibleCount, isGenerating, generationId,
    setPrompt, setProductType, setDifficulty,
    handleGenerate, handleClear,
  };
}
