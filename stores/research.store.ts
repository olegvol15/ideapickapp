import { create } from 'zustand';
import type { GenerateResponse, ProductType, Difficulty } from '@/types';

export type ResearchPhase =
  | 'idle'
  | 'thinking'
  | 'generating'
  | 'streaming'
  | 'done'
  | 'error';

export interface PersistedResearch {
  prompt: string;
  productType: ProductType | '';
  difficulty: Difficulty | '';
  result: GenerateResponse;
  generationId: string | null;
  createdAt: number;
}

interface ResearchState {
  prompt: string;
  productType: ProductType | '';
  difficulty: Difficulty | '';
  result: GenerateResponse | null;
  generationId: string | null;
  localHistory: PersistedResearch[];
  phase: ResearchPhase;
  visibleCount: number;
  statusLabel: string;
  errorMessage: string | null;

  autoGenerate: boolean;

  setPrompt: (v: string) => void;
  setProductType: (v: ProductType | '') => void;
  setDifficulty: (v: Difficulty | '') => void;
  setPhase: (phase: ResearchPhase) => void;
  setVisibleCount: (count: number) => void;
  setStatusLabel: (label: string) => void;
  setErrorMessage: (msg: string | null) => void;
  setResult: (result: GenerateResponse | null, generationId: string | null) => void;
  setAutoGenerate: (v: boolean) => void;
  restore: (entry: PersistedResearch) => void;
  pushLocalHistory: (entry: PersistedResearch) => void;
  removeLocalHistory: (createdAt: string) => void;
  renameLocalHistory: (createdAt: string, prompt: string) => void;
  clear: () => void;
}

export const useResearchStore = create<ResearchState>()((set) => ({
  prompt: '',
  productType: '',
  difficulty: '',
  result: null,
  generationId: null,
  localHistory: [],
  phase: 'idle',
  visibleCount: 0,
  statusLabel: '',
  errorMessage: null,
  autoGenerate: false,

  setPrompt: (v) => set({ prompt: v }),
  setProductType: (v) => set({ productType: v }),
  setDifficulty: (v) => set({ difficulty: v }),
  setPhase: (phase) => set({ phase }),
  setVisibleCount: (count) => set({ visibleCount: count }),
  setStatusLabel: (label) => set({ statusLabel: label }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  setResult: (result, generationId) => set({ result, generationId }),
  setAutoGenerate: (v) => set({ autoGenerate: v }),

  restore: (entry) =>
    set({
      prompt: entry.prompt,
      productType: entry.productType,
      difficulty: entry.difficulty,
      result: entry.result,
      generationId: entry.generationId,
      visibleCount: entry.result.ideas.length,
      phase: 'done',
    }),

  pushLocalHistory: (entry) =>
    set((state) => {
      const deduped = state.localHistory.filter((h) => h.prompt !== entry.prompt);
      return { localHistory: [entry, ...deduped].slice(0, 20) };
    }),

  removeLocalHistory: (createdAt) =>
    set((state) => ({
      localHistory: state.localHistory.filter(
        (h) => String(h.createdAt) !== createdAt
      ),
    })),

  renameLocalHistory: (createdAt, prompt) =>
    set((state) => ({
      localHistory: state.localHistory.map((h) =>
        String(h.createdAt) === createdAt ? { ...h, prompt } : h
      ),
    })),

  clear: () =>
    set({
      prompt: '',
      productType: '',
      difficulty: '',
      result: null,
      generationId: null,
      phase: 'idle',
      visibleCount: 0,
      statusLabel: '',
      errorMessage: null,
      autoGenerate: false,
    }),
}));
