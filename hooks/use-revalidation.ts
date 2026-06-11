'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { validateIdeaStream } from '@/services/validate.service';
import { useValidateStore } from '@/stores/validate.store';
import { useAuth } from '@/context/auth';
import { useUpdateValidation, UUID_RE } from '@/hooks/use-validations';
import { toast } from 'sonner';
import type { PainEvidenceResult } from '@/lib/schemas';
import type { EvidenceSource } from '@/types/validate.types';

export function useRevalidation(id: string, productType: string) {
  const { user } = useAuth();
  const updateValidationMutation = useUpdateValidation(user?.id);
  const updateLocalValidation = useValidateStore((s) => s.updateLocalValidation);
  const [version, setVersion] = useState(1);
  const isUUID = UUID_RE.test(id);
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation<
    { result: PainEvidenceResult; sources: EvidenceSource[] },
    Error,
    string
  >({
    mutationFn: async (newDescription) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      return validateIdeaStream(
        { description: newDescription, productType },
        { signal: controller.signal }
      );
    },
    onSuccess: (data, newDescription) => {
      setVersion((v) => v + 1);
      updateLocalValidation(id, {
        description: newDescription,
        result: data.result,
        sources: data.sources,
      });
      if (user && isUUID) {
        updateValidationMutation.mutate({
          id,
          description: newDescription,
          result: data.result,
          sources: data.sources,
        });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err) => {
      if (err.name === 'AbortError') return;
      toast.error(err.message ?? 'Re-validation failed.');
    },
    retry: false,
  });

  return {
    handleRevalidate: mutation.mutate,
    isRevalidating: mutation.isPending,
    latestResult: mutation.data,
    latestDescription: mutation.variables,
    version,
  };
}
