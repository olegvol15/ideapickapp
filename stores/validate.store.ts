import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

export type ValidationPhase =
  | 'idle'
  | 'thinking'
  | 'researching'
  | 'analyzing'
  | 'done'
  | 'error';

export interface PersistedValidation {
  id: string;
  description: string;
  productType: string;
  result: EnhancedValidationResult;
  competitors: Competitor[];
  createdAt: number;
}

interface ValidateState {
  // persisted — validation history
  localValidations: PersistedValidation[];
  pushLocalValidation: (entry: PersistedValidation) => void;
  removeLocalValidation: (id: string) => void;
  renameLocalValidation: (id: string, description: string) => void;
  updateLocalValidation: (
    id: string,
    updates: Partial<Pick<PersistedValidation, 'description' | 'result' | 'competitors'>>
  ) => void;
  updateLocalValidationId: (oldId: string, newId: string) => void;

  // session — active validation (not persisted)
  phase: ValidationPhase;
  error: string;
  result: EnhancedValidationResult | null;
  prevResult: EnhancedValidationResult | null;
  competitors: Competitor[];
  currentId: string | null;
  version: number;
  setPhase: (phase: ValidationPhase) => void;
  setError: (error: string) => void;
  setResult: (result: EnhancedValidationResult | null) => void;
  setPrevResult: (result: EnhancedValidationResult | null) => void;
  setCompetitors: (competitors: Competitor[]) => void;
  setCurrentId: (id: string | null) => void;
  incrementVersion: () => void;
  resetSession: () => void;
}

export const useValidateStore = create<ValidateState>()(
  persist(
    (set) => ({
      localValidations: [],

      pushLocalValidation: (entry) =>
        set((state) => ({
          localValidations: [entry, ...state.localValidations].slice(0, 20),
        })),

      removeLocalValidation: (id) =>
        set((state) => ({
          localValidations: state.localValidations.filter((v) => v.id !== id),
        })),

      renameLocalValidation: (id, description) =>
        set((state) => ({
          localValidations: state.localValidations.map((v) =>
            v.id === id ? { ...v, description } : v
          ),
        })),

      updateLocalValidation: (id, updates) =>
        set((state) => ({
          localValidations: state.localValidations.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        })),

      updateLocalValidationId: (oldId, newId) =>
        set((state) => ({
          localValidations: state.localValidations.map((v) =>
            v.id === oldId ? { ...v, id: newId } : v
          ),
        })),

      phase: 'idle',
      error: '',
      result: null,
      prevResult: null,
      competitors: [],
      currentId: null,
      version: 1,

      setPhase: (phase) => set({ phase }),
      setError: (error) => set({ error }),
      setResult: (result) => set({ result }),
      setPrevResult: (prevResult) => set({ prevResult }),
      setCompetitors: (competitors) => set({ competitors }),
      setCurrentId: (currentId) => set({ currentId }),
      incrementVersion: () => set((s) => ({ version: s.version + 1 })),
      resetSession: () => set({ phase: 'idle', error: '', result: null, prevResult: null, competitors: [], currentId: null, version: 1 }),
    }),
    {
      name: 'ideapick:validations',
      partialize: (state) => ({ localValidations: state.localValidations }),
    }
  )
);
