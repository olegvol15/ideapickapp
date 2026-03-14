import { create } from 'zustand';
import type { Idea, ValidationResult } from '@/types';

interface IdeaDraftState {
  draft: Idea | null;
  generationId: string | null;
  validation: ValidationResult | null;

  // Sets a new draft and clears stale validation
  setDraft: (idea: Idea | null, generationId?: string | null) => void;
  // Applied by the refine mutation's onSuccess
  applyRefinement: (refined: Idea) => void;
  // Applied by the validate mutation's onSuccess
  setValidation: (v: ValidationResult | null) => void;
  clearValidation: () => void;
  clearDraft: () => void;
}

export const useIdeaDraftStore = create<IdeaDraftState>()((set) => ({
  draft: null,
  generationId: null,
  validation: null,

  setDraft: (idea, generationId = null) =>
    set({ draft: idea, generationId, validation: null }),

  applyRefinement: (refined) => set({ draft: refined, validation: null }),

  setValidation: (v) => set({ validation: v }),

  clearValidation: () => set({ validation: null }),

  clearDraft: () => set({ draft: null, generationId: null, validation: null }),
}));
