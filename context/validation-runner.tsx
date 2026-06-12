'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth';
import { useSaveValidation, useUpdateValidation } from '@/hooks/use-validations';
import { wait } from '@/lib/utils';
import { validateIdeaStream } from '@/services/validate.service';
import { useValidateStore } from '@/stores/validate.store';
import type { ValidateRequest } from '@/types/validate.types';

interface ValidationRunnerContextValue {
  start: (request: ValidateRequest) => void;
  cancel: () => void;
}

const ValidationRunnerContext =
  createContext<ValidationRunnerContextValue | null>(null);

function isValidationActive() {
  const phase = useValidateStore.getState().phase;
  return (
    phase === 'thinking' ||
    phase === 'researching' ||
    phase === 'analyzing'
  );
}

export function ValidationRunnerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const saveValidation = useSaveValidation(user?.id);
  const updateValidation = useUpdateValidation(user?.id);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const cancel = useCallback(() => {
    runIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    useValidateStore.getState().resetSession();
  }, []);

  const start = useCallback(
    (request: ValidateRequest) => {
      if (isValidationActive()) {
        router.push('/validate');
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const runId = ++runIdRef.current;
      const store = useValidateStore.getState();

      store.setPrevResult(store.result);
      store.setResult(null);
      store.setSources([]);
      store.setError('');
      store.setActiveRequest(request);
      store.setPhase('thinking');

      void (async () => {
        try {
          await wait(800);
          if (controller.signal.aborted) {
            throw new DOMException('Aborted', 'AbortError');
          }

          useValidateStore.getState().setPhase('researching');
          const data = await validateIdeaStream(request, {
            signal: controller.signal,
            onSources: (sources) => {
              if (runId !== runIdRef.current) return;
              const currentStore = useValidateStore.getState();
              currentStore.setSources(sources);
              currentStore.setPhase('analyzing');
            },
          });

          if (runId !== runIdRef.current) return;
          const currentStore = useValidateStore.getState();
          currentStore.setResult(data.result);
          currentStore.setSources(data.sources);
          currentStore.setPhase('done');

          let reportHref = '/validate';
          const { currentId } = currentStore;

          if (currentId) {
            currentStore.incrementVersion();
            currentStore.updateLocalValidation(currentId, {
              description: request.description,
              result: data.result,
              sources: data.sources,
            });
            reportHref = `/validate/${currentId}`;
            try {
              await updateValidation.mutateAsync({
                id: currentId,
                description: request.description,
                result: data.result,
                sources: data.sources,
              });
            } catch {
              reportHref = '/validate';
            }
          } else {
            const localId = String(Date.now());
            currentStore.setCurrentId(localId);
            currentStore.pushLocalValidation({
              id: localId,
              description: request.description,
              productType: request.productType,
              result: data.result,
              sources: data.sources,
              createdAt: Date.now(),
            });
            reportHref = `/validate/${localId}`;

            if (user) {
              try {
                const savedId = await saveValidation.mutateAsync({
                  description: request.description,
                  productType: request.productType,
                  result: data.result,
                  sources: data.sources,
                });
                if (savedId) {
                  currentStore.updateLocalValidationId(localId, savedId);
                  if (
                    useValidateStore.getState().activeRequest === request
                  ) {
                    currentStore.setCurrentId(savedId);
                  }
                  reportHref = `/validate/${savedId}`;
                }
              } catch {
                reportHref = '/validate';
                toast.error(
                  'Validation finished, but it could not be saved to your account.'
                );
              }
            }
          }

          if (
            useValidateStore.getState().activeRequest === request &&
            window.location.pathname !== '/validate'
          ) {
            toast.success('Validation complete', {
              action: {
                label: 'View report',
                onClick: () => router.push(reportHref),
              },
              duration: 8000,
            });
          }
        } catch (error) {
          if (
            runId !== runIdRef.current ||
            (error instanceof DOMException && error.name === 'AbortError')
          ) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : 'Something went wrong. Please try again.';
          const currentStore = useValidateStore.getState();
          currentStore.setError(message);
          currentStore.setPhase('error');

          if (window.location.pathname !== '/validate') {
            toast.error('Validation failed', {
              description: message,
              action: {
                label: 'View',
                onClick: () => router.push('/validate'),
              },
            });
          }
        } finally {
          if (runId === runIdRef.current) abortRef.current = null;
        }
      })();
    },
    [router, saveValidation, updateValidation, user]
  );

  const value = useMemo(() => ({ start, cancel }), [start, cancel]);

  return (
    <ValidationRunnerContext.Provider value={value}>
      {children}
    </ValidationRunnerContext.Provider>
  );
}

export function useValidationRunner(): ValidationRunnerContextValue {
  const context = useContext(ValidationRunnerContext);
  if (!context) {
    throw new Error(
      'useValidationRunner must be used inside ValidationRunnerProvider'
    );
  }
  return context;
}
