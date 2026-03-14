import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

interface PersistedState {
  prompt: string;
  productType: ProductType | '';
  difficulty: Difficulty | '';
  result: GenerateResponse | null;
  generationId: string | null;
  localHistory: PersistedResearch[];
}

interface ResearchState extends PersistedState {
  phase: ResearchPhase;
  visibleCount: number;

  setPrompt: (v: string) => void;
  setProductType: (v: ProductType | '') => void;
  setDifficulty: (v: Difficulty | '') => void;
  setPhase: (phase: ResearchPhase) => void;
  setVisibleCount: (count: number) => void;
  setResult: (
    result: GenerateResponse | null,
    generationId: string | null
  ) => void;
  restore: (entry: PersistedResearch) => void;
  pushLocalHistory: (entry: PersistedResearch) => void;
  clear: () => void;
}

export const useResearchStore = create<ResearchState>()(
  persist(
    (set) => ({
      prompt: '',
      productType: '',
      difficulty: '',
      result: null,
      generationId: null,
      localHistory: [],
      phase: 'idle',
      visibleCount: 0,

      setPrompt: (v) => set({ prompt: v }),
      setProductType: (v) => set({ productType: v }),
      setDifficulty: (v) => set({ difficulty: v }),
      setPhase: (phase) => set({ phase }),
      setVisibleCount: (count) => set({ visibleCount: count }),
      setResult: (result, generationId) => set({ result, generationId }),

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
          const deduped = state.localHistory.filter(
            (h) => h.prompt !== entry.prompt
          );
          return { localHistory: [entry, ...deduped].slice(0, 20) };
        }),

      clear: () =>
        set({
          prompt: '',
          productType: '',
          difficulty: '',
          result: null,
          generationId: null,
          phase: 'idle',
          visibleCount: 0,
        }),
    }),
    {
      name: 'ideapick:research',
      partialize: (state): PersistedState => ({
        prompt: state.prompt,
        productType: state.productType,
        difficulty: state.difficulty,
        result: state.result,
        generationId: state.generationId,
        localHistory: state.localHistory,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.phase = state.result ? 'done' : 'idle';
          state.visibleCount = state.result?.ideas.length ?? 0;
        }
      },
    }
  )
);
