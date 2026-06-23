import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PainEvidenceResult } from '@/lib/schemas';
import type {
  EvidenceSource,
  ValidateRequest,
} from '@/types/validate.types';

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
  result: PainEvidenceResult;
  sources: EvidenceSource[];
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
    updates: Partial<Pick<PersistedValidation, 'description' | 'result' | 'sources'>>
  ) => void;
  updateLocalValidationId: (oldId: string, newId: string) => void;

  // persisted — report ids whose Idy reveal has already played once
  seenReveals: string[];
  markRevealSeen: (id: string) => void;

  // session — active validation (not persisted)
  phase: ValidationPhase;
  error: string;
  result: PainEvidenceResult | null;
  prevResult: PainEvidenceResult | null;
  sources: EvidenceSource[];
  activeRequest: ValidateRequest | null;
  currentId: string | null;
  version: number;
  setPhase: (phase: ValidationPhase) => void;
  setError: (error: string) => void;
  setResult: (result: PainEvidenceResult | null) => void;
  setPrevResult: (result: PainEvidenceResult | null) => void;
  setSources: (sources: EvidenceSource[]) => void;
  setActiveRequest: (request: ValidateRequest | null) => void;
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
      sources: [],
      activeRequest: null,
      currentId: null,
      version: 1,

      seenReveals: [],
      markRevealSeen: (id) =>
        set((state) =>
          state.seenReveals.includes(id)
            ? state
            : { seenReveals: [...state.seenReveals, id].slice(-200) }
        ),

      setPhase: (phase) => set({ phase }),
      setError: (error) => set({ error }),
      setResult: (result) => set({ result }),
      setPrevResult: (prevResult) => set({ prevResult }),
      setSources: (sources) => set({ sources }),
      setActiveRequest: (activeRequest) => set({ activeRequest }),
      setCurrentId: (currentId) => set({ currentId }),
      incrementVersion: () => set((s) => ({ version: s.version + 1 })),
      resetSession: () =>
        set({
          phase: 'idle',
          error: '',
          result: null,
          prevResult: null,
          sources: [],
          activeRequest: null,
          currentId: null,
          version: 1,
        }),
    }),
    {
      name: 'ideapick:validations',
      partialize: (state) => ({
        localValidations: state.localValidations,
        seenReveals: state.seenReveals,
      }),
    }
  )
);
