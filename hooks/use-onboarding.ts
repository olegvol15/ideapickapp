import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { useResearchStore } from '@/stores/research.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { saveIdeaToDB } from '@/services/db/saved-idea.db';
import type { ExploreIdea } from '@/types';
import { LOADING_MESSAGES } from '@/constants/onboarding';
import { exploreIdeaToIdea, quickValidateApi, exploreIdeasApi } from '@/lib/onboarding';
import { useCyclingLabel } from '@/hooks/use-cycling-label';

export function useOnboarding() {
  const router = useRouter();
  const { user, updateMetadata } = useAuth();
  const store = useOnboardingStore();

  const analyzeIdeaMutation = useMutation({
    mutationFn: () =>
      quickValidateApi({
        description: store.idea.trim(),
        audience: store.audience.trim(),
        problem: store.problem.trim(),
      }),
    onMutate: () => store.setPhase('loading'),
    onSuccess: (data) => {
      store.setIdeaResult(data);
      store.setPhase('idea-result');
    },
    onError: () => {
      store.setPhase('idea-collect');
      store.setIdeaStep(3);
    },
    retry: false,
  });

  const exploreIdeasMutation = useMutation({
    mutationFn: (previousTitles?: string[]) =>
      exploreIdeasApi({ interest: store.interest.trim(), previousTitles }),
    onMutate: () => {
      store.setPhase('loading');
    },
    onSuccess: (ideas) => {
      store.setExploreIdeas(ideas);
      store.goToCarousel(0);
      store.setPhase('explore-results');
    },
    onError: (_err, _vars, _ctx) => {
      if (store.exploreIdeas.length) {
        store.setPhase('explore-results');
      } else {
        store.setPhase('interest');
      }
    },
    retry: false,
  });

  const saveAndCompleteMutation = useMutation({
    mutationFn: async (picked: ExploreIdea) => {
      if (!user) throw new Error('Not authenticated');
      await saveIdeaToDB({ userId: user.id, generationId: null, idea: exploreIdeaToIdea(picked) });
      await updateMetadata({
        initial_idea: picked.title,
        initial_interest: store.interest.trim(),
        onboarding_completed: true,
      });
    },
    onSuccess: () => {
      store.reset();
      router.push('/ideas');
    },
    retry: false,
  });

  const expandIdeaMutation = useMutation({
    mutationFn: async () => {
      useResearchStore.getState().setPrompt(store.idea.trim());
      useResearchStore.getState().setAutoGenerate(true);
      await updateMetadata({ initial_idea: store.idea.trim(), onboarding_completed: true });
    },
    onSuccess: () => {
      store.reset();
      router.push('/');
    },
    retry: false,
  });

  const isLoading = analyzeIdeaMutation.isPending || exploreIdeasMutation.isPending;
  const loadingMsg = useCyclingLabel(isLoading, LOADING_MESSAGES, 700);

  const error =
    analyzeIdeaMutation.error?.message ??
    exploreIdeasMutation.error?.message ??
    saveAndCompleteMutation.error?.message ??
    null;

  return {
    phase: store.phase,
    setPhase: store.setPhase,
    loadingMsg,
    error,
    saving: saveAndCompleteMutation.isPending || expandIdeaMutation.isPending,
    ideaStep: store.ideaStep,
    setIdeaStep: store.setIdeaStep,
    idea: store.idea,
    setIdea: store.setIdea,
    audience: store.audience,
    setAudience: store.setAudience,
    problem: store.problem,
    setProblem: store.setProblem,
    ideaResult: store.ideaResult,
    interest: store.interest,
    setInterest: store.setInterest,
    exploreIdeas: store.exploreIdeas,
    carouselIdx: store.carouselIdx,
    carouselDir: store.carouselDir,
    hasRefined: store.hasRefined,
    goToCarousel: store.goToCarousel,
    analyzeIdea: () => analyzeIdeaMutation.mutate(),
    generateExploreIdeas: () => exploreIdeasMutation.mutate(undefined),
    adjustDirection: () => {
      if (store.hasRefined) return;
      store.setHasRefined(true);
      exploreIdeasMutation.mutate(store.exploreIdeas.map((i) => i.title));
    },
    handleExpandIdea: () => expandIdeaMutation.mutate(),
    saveAndComplete: (picked: ExploreIdea) => saveAndCompleteMutation.mutate(picked),
  };
}
