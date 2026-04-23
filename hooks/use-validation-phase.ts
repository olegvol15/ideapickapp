import { useState, useRef, useEffect } from 'react';

export type ValidationPhase = 'idle' | 'thinking' | 'researching' | 'analyzing' | 'done' | 'error';

interface UseValidationPhaseReturn {
  phase: ValidationPhase;
  error: string;
  abortRef: React.MutableRefObject<AbortController | null>;
  isActive: boolean;
  setPhase: (phase: ValidationPhase) => void;
  setError: (msg: string) => void;
  cancel: () => void;
}

export function useValidationPhase(): UseValidationPhaseReturn {
  const [phase, setPhase] = useState<ValidationPhase>('idle');
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  function cancel() {
    abortRef.current?.abort();
    setPhase('idle');
  }

  return {
    phase,
    error,
    abortRef,
    isActive: phase === 'thinking' || phase === 'researching' || phase === 'analyzing',
    setPhase,
    setError,
    cancel,
  };
}
