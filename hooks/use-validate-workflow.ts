'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { validateIdeaStream } from '@/services/validate.service';
import { useValidateStore } from '@/stores/validate.store';
import { useSaveValidation } from '@/hooks/use-validations';
import { updateValidation } from '@/services/db.service';
import { useAuth } from '@/context/auth';
import { useValidationPhase } from '@/hooks/use-validation-phase';
import { toast } from 'sonner';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

interface SubmitOverrides {
  description?: string;
  productType?: string;
  audience?: string;
  problem?: string;
}

export function useValidateWorkflow() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const saveValidation = useSaveValidation(user?.id);
  const pushLocalValidation = useValidateStore((s) => s.pushLocalValidation);
  const updateLocalValidationId = useValidateStore(
    (s) => s.updateLocalValidationId
  );
  const updateLocalValidation = useValidateStore(
    (s) => s.updateLocalValidation
  );

  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [audience, setAudience] = useState('');
  const [problem, setProblem] = useState('');

  const [result, setResult] = useState<EnhancedValidationResult | null>(null);
  const [prevResult, setPrevResult] = useState<EnhancedValidationResult | null>(
    null
  );
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorCount, setCompetitorCount] = useState(0);
  const [version, setVersion] = useState(1);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const { phase, error, abortRef, isActive, setPhase, setError, cancel } =
    useValidationPhase();

  const canSubmit =
    description.trim().length > 0 && productType.length > 0 && !isActive;

  async function handleSubmit(overrides?: SubmitOverrides) {
    const desc = overrides?.description ?? description;
    const pt = overrides?.productType ?? productType;
    const aud = overrides?.audience ?? audience;
    const prob = overrides?.problem ?? problem;

    if (overrides?.description) setDescription(overrides.description);
    if (overrides?.productType) setProductType(overrides.productType);
    if (overrides?.audience) setAudience(overrides.audience);
    if (overrides?.problem) setProblem(overrides.problem);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPrevResult(result);
    setResult(null);
    setCompetitors([]);
    setCompetitorCount(0);
    setError('');
    setPhase('thinking');

    await new Promise((r) => setTimeout(r, 800));
    if (controller.signal.aborted) return;

    setPhase('researching');

    try {
      const data = await validateIdeaStream(
        {
          description: desc,
          productType: pt,
          audience: aud.trim() || undefined,
          problem: prob.trim() || undefined,
        },
        {
          signal: controller.signal,
          onResearch: (found) => {
            setCompetitorCount(found.length);
            setCompetitors(found);
            setPhase('analyzing');
          },
        }
      );

      setResult(data.result);
      setCompetitors(data.competitors);
      setPhase('done');

      if (currentId && !overrides?.productType) {
        setVersion((v) => v + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        updateLocalValidation(currentId, {
          description: desc,
          result: data.result,
          competitors: data.competitors,
        });
        if (user) {
          updateValidation(
            user.id,
            currentId,
            desc,
            data.result,
            data.competitors
          ).catch(() => {
            toast.error('Failed to update validation.');
          });
        }
      } else {
        const localId = String(Date.now());
        setCurrentId(localId);
        pushLocalValidation({
          id: localId,
          description: desc,
          productType: pt,
          result: data.result,
          competitors: data.competitors,
          createdAt: Date.now(),
        });
        if (user) {
          saveValidation
            .mutateAsync({
              description: desc,
              productType: pt,
              result: data.result,
              competitors: data.competitors,
            })
            .then((uuid) => {
              if (uuid) {
                updateLocalValidationId(localId, uuid);
                setCurrentId(uuid);
              }
            })
            .catch(() => {
              toast.error('Failed to save validation to your account.');
            });
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setError(
        (err as { message?: string }).message ??
          'Something went wrong. Please try again.'
      );
      setPhase('error');
    }
  }

  // Auto-submit when arriving from the idea modal via query params (runs once on mount).
  // Immediately strips params from URL so a page refresh doesn't re-trigger.
  useEffect(() => {
    const desc = searchParams.get('description');
    const pt = searchParams.get('productType');
    if (!desc || !pt) return;
    const aud = searchParams.get('audience') ?? undefined;
    const prob = searchParams.get('problem') ?? undefined;
    router.replace('/validate');
    handleSubmit({
      description: desc,
      productType: pt,
      audience: aud,
      problem: prob,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    description,
    setDescription,
    productType,
    setProductType,
    audience,
    setAudience,
    problem,
    setProblem,
    phase,
    error,
    isActive,
    cancel,
    canSubmit,
    result,
    prevResult,
    competitors,
    competitorCount,
    version,
    handleSubmit,
  };
}
