import { create } from 'zustand';
import type { QuickValidateResponse, ExploreIdea } from '@/types';
import type { Phase, IdeaStep } from '@/types/onboarding.types';

interface OnboardingState {
  phase: Phase;
  ideaStep: IdeaStep;
  idea: string;
  audience: string;
  problem: string;
  ideaResult: QuickValidateResponse | null;
  interest: string;
  exploreIdeas: ExploreIdea[];
  carouselIdx: number;
  carouselDir: number;
  hasRefined: boolean;

  setPhase: (phase: Phase) => void;
  setIdeaStep: (step: IdeaStep) => void;
  setIdea: (idea: string) => void;
  setAudience: (audience: string) => void;
  setProblem: (problem: string) => void;
  setIdeaResult: (result: QuickValidateResponse | null) => void;
  setInterest: (interest: string) => void;
  setExploreIdeas: (ideas: ExploreIdea[]) => void;
  goToCarousel: (idx: number) => void;
  setHasRefined: (v: boolean) => void;
  reset: () => void;
}

const INITIAL: Pick<
  OnboardingState,
  | 'phase' | 'ideaStep' | 'idea' | 'audience' | 'problem'
  | 'ideaResult' | 'interest' | 'exploreIdeas'
  | 'carouselIdx' | 'carouselDir' | 'hasRefined'
> = {
  phase: 'intent',
  ideaStep: 1,
  idea: '',
  audience: '',
  problem: '',
  ideaResult: null,
  interest: '',
  exploreIdeas: [],
  carouselIdx: 0,
  carouselDir: 1,
  hasRefined: false,
};

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  ...INITIAL,

  setPhase: (phase) => set({ phase }),
  setIdeaStep: (ideaStep) => set({ ideaStep }),
  setIdea: (idea) => set({ idea }),
  setAudience: (audience) => set({ audience }),
  setProblem: (problem) => set({ problem }),
  setIdeaResult: (ideaResult) => set({ ideaResult }),
  setInterest: (interest) => set({ interest }),
  setExploreIdeas: (exploreIdeas) => set({ exploreIdeas }),
  goToCarousel: (idx) =>
    set({ carouselDir: idx > get().carouselIdx ? 1 : -1, carouselIdx: idx }),
  setHasRefined: (hasRefined) => set({ hasRefined }),
  reset: () => set(INITIAL),
}));
