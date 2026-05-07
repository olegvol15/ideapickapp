'use client';

import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { validateIdeaStream } from '@/services/validate.service';
import { useValidateStore } from '@/stores/validate.store';
import { useSaveValidation, useUpdateValidation } from '@/hooks/use-validations';
import { useAuth } from '@/context/auth';
import { wait } from '@/lib/utils';
import { toast } from 'sonner';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

export function useValidateWorkflow() {
  const { user } = useAuth();
  const store = useValidateStore();
  const saveValidation = useSaveValidation(user?.id);
  const updateValidationMutation = useUpdateValidation(user?.id);
  const abortRef = useRef<AbortController | null>(null);

  const isActive =
    store.phase === 'thinking' ||
    store.phase === 'researching' ||
    store.phase === 'analyzing';

  function cancel() {
    abortRef.current?.abort();
    store.setPhase('idle');
  }

  const validateMutation = useMutation<
    { result: EnhancedValidationResult; competitors: Competitor[] },
    Error,
    { desc: string; pt: string; aud: string | undefined; prob: string | undefined; signal: AbortSignal }
  >({
    mutationFn: async (vars) => {
      await wait(800);
      if (vars.signal.aborted) throw new DOMException('Aborted', 'AbortError');
      store.setPhase('researching');
      return validateIdeaStream(
        {
          description: vars.desc,
          productType: vars.pt,
          audience: vars.aud,
          problem: vars.prob,
        },
        {
          signal: vars.signal,
          onResearch: (found) => {
            store.setCompetitors(found);
            store.setPhase('analyzing');
          },
        }
      );
    },
    onSuccess: (data, vars) => {
      store.setResult(data.result);
      store.setCompetitors(data.competitors);
      store.setPhase('done');

      const { currentId } = useValidateStore.getState();

      if (currentId) {
        store.incrementVersion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        store.updateLocalValidation(currentId, {
          description: vars.desc,
          result: data.result,
          competitors: data.competitors,
        });
        updateValidationMutation.mutate({
          id: currentId,
          description: vars.desc,
          result: data.result,
          competitors: data.competitors,
        });
      } else {
        const localId = String(Date.now());
        store.setCurrentId(localId);
        store.pushLocalValidation({
          id: localId,
          description: vars.desc,
          productType: vars.pt,
          result: data.result,
          competitors: data.competitors,
          createdAt: Date.now(),
        });
        if (user) {
          saveValidation
            .mutateAsync({
              description: vars.desc,
              productType: vars.pt,
              result: data.result,
              competitors: data.competitors,
            })
            .then((uuid) => {
              if (uuid) {
                store.updateLocalValidationId(localId, uuid);
                store.setCurrentId(uuid);
              }
            })
            .catch(() => toast.error('Failed to save validation to your account.'));
        }
      }
    },
    onError: (err) => {
      if (err.name === 'AbortError') return;
      store.setError(err.message ?? 'Something went wrong. Please try again.');
      store.setPhase('error');
    },
    retry: false,
  });

  function handleSubmit(desc: string, pt: string, aud?: string, prob?: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    store.setPrevResult(store.result);
    store.setResult(null);
    store.setCompetitors([]);
    store.setError('');
    store.setPhase('thinking');

    validateMutation.mutate({
      desc,
      pt,
      aud: aud?.trim() || undefined,
      prob: prob?.trim() || undefined,
      signal: controller.signal,
    });
  }

  return {
    phase: store.phase,
    error: store.error,
    isActive,
    cancel,
    handleSubmit,
    resetSession: store.resetSession,
  };
}
