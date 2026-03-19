import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

export interface PersistedValidation {
  id: string;
  description: string;
  productType: string;
  result: EnhancedValidationResult;
  competitors: Competitor[];
  createdAt: number;
}

interface ValidateState {
  localValidations: PersistedValidation[];
  pushLocalValidation: (entry: PersistedValidation) => void;
  removeLocalValidation: (id: string) => void;
  updateLocalValidationId: (oldId: string, newId: string) => void;
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

      updateLocalValidationId: (oldId, newId) =>
        set((state) => ({
          localValidations: state.localValidations.map((v) =>
            v.id === oldId ? { ...v, id: newId } : v
          ),
        })),
    }),
    { name: 'ideapick:validations' }
  )
);
