'use client';

import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/use-onboarding';
import { IntentPhase } from './phases/IntentPhase';
import { IdeaCollectPhase } from './phases/IdeaCollectPhase';
import { InterestPhase } from './phases/InterestPhase';
import { LoadingPhase } from './phases/LoadingPhase';
import { IdeaResultPhase } from './phases/IdeaResultPhase';
import { ExploreResultsPhase } from './phases/ExploreResultsPhase';

export function OnboardingWizard() {
  const {
    phase, setPhase,
    loadingMsg,
    error,
    saving,
    ideaStep, setIdeaStep,
    idea, setIdea,
    audience, setAudience,
    problem, setProblem,
    ideaResult,
    interest, setInterest,
    exploreIdeas,
    carouselIdx,
    carouselDir,
    hasRefined,
    goToCarousel,
    analyzeIdea,
    generateExploreIdeas,
    adjustDirection,
    handleExpandIdea,
    saveAndComplete,
  } = useOnboarding();

  const dotsTotal = phase === 'idea-collect' ? 3 : 0;
  const dotsFilled = phase === 'idea-collect' ? ideaStep : 0;

  return (
    <div className="w-full">
      {dotsTotal > 0 && (
        <div className="mb-10 flex items-center justify-center gap-2">
          {Array.from({ length: dotsTotal }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 w-10 rounded-full transition-all duration-300',
                i < dotsFilled ? 'bg-[#0077b6]' : 'bg-white/[0.10]'
              )}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'intent' && (
          <IntentPhase
            onSelectHaveIdea={() => { setIdeaStep(1); setPhase('idea-collect'); }}
            onSelectExplore={() => setPhase('interest')}
          />
        )}

        {phase === 'idea-collect' && (
          <IdeaCollectPhase
            ideaStep={ideaStep}
            idea={idea}
            audience={audience}
            problem={problem}
            error={error}
            setIdea={setIdea}
            setAudience={setAudience}
            setProblem={setProblem}
            setIdeaStep={setIdeaStep}
            onAnalyze={analyzeIdea}
          />
        )}

        {phase === 'interest' && (
          <InterestPhase
            interest={interest}
            setInterest={setInterest}
            onGenerate={generateExploreIdeas}
          />
        )}

        {phase === 'loading' && (
          <LoadingPhase loadingMsg={loadingMsg} />
        )}

        {phase === 'idea-result' && ideaResult && (
          <IdeaResultPhase
            ideaResult={ideaResult}
            saving={saving}
            onExpand={handleExpandIdea}
          />
        )}

        {phase === 'explore-results' && exploreIdeas.length > 0 && (
          <ExploreResultsPhase
            exploreIdeas={exploreIdeas}
            carouselIdx={carouselIdx}
            carouselDir={carouselDir}
            hasRefined={hasRefined}
            saving={saving}
            error={error}
            goToCarousel={goToCarousel}
            onSave={saveAndComplete}
            onAdjust={adjustDirection}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
