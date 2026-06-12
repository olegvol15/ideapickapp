'use client';

import { useValidationRunner } from '@/context/validation-runner';
import { useValidateStore } from '@/stores/validate.store';

export function useValidateWorkflow() {
  const { start, cancel } = useValidationRunner();
  const phase = useValidateStore((state) => state.phase);
  const error = useValidateStore((state) => state.error);
  const activeRequest = useValidateStore((state) => state.activeRequest);
  const resetSession = useValidateStore((state) => state.resetSession);
  const isActive =
    phase === 'thinking' ||
    phase === 'researching' ||
    phase === 'analyzing';

  function handleSubmit(
    description: string,
    productType: string,
    audience?: string,
    problem?: string
  ) {
    start({
      description,
      productType,
      audience: audience?.trim() || undefined,
      problem: problem?.trim() || undefined,
    });
  }

  return {
    phase,
    error,
    activeRequest,
    isActive,
    cancel,
    handleSubmit,
    resetSession,
  };
}
