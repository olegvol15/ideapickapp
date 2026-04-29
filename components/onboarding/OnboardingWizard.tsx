'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth';
import { useResearchStore } from '@/stores/research.store';
import { cn } from '@/lib/utils';
import { saveIdeaToDB } from '@/services/db.service';
import type { QuickValidateResponse, ExploreIdea, Idea, SignalLevel } from '@/types';

type Phase =
  | 'intent'
  | 'idea-collect'
  | 'interest'
  | 'constraints'
  | 'loading'
  | 'idea-result'
  | 'explore-results';

type IdeaStep = 1 | 2 | 3;

const INTERESTS = ['AI tools', 'Productivity', 'Health', 'Finance', 'Other'] as const;
const CONSTRAINTS = ['Fast to build', 'Solo dev friendly', 'B2C', 'B2B'] as const;

const LOADING_MESSAGES = [
  'Mapping the competitive landscape…',
  'Identifying market signals…',
  'Running risk analysis…',
  'Calculating opportunity score…',
  'Finalizing verdict…',
];

const fieldInput =
  'bg-[#141414] border border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:border-white/[0.22] transition-colors text-sm';

function choiceBtn(active: boolean) {
  return cn(
    'rounded-xl border px-4 py-3 text-sm text-left transition-colors',
    active
      ? 'border-[#0077b6] bg-[#0077b6]/20 text-white'
      : 'border-white/[0.08] bg-[#141414] text-white/45 hover:border-white/[0.18] hover:text-white/75'
  );
}

function verdictColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 55) return '#0077b6';
  if (score >= 35) return '#f59e0b';
  return '#ef4444';
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function exploreIdeaToIdea(idea: ExploreIdea): Idea {
  const demand: SignalLevel = idea.score >= 65 ? 'High' : idea.score >= 40 ? 'Medium' : 'Low';
  const competition: SignalLevel = idea.score >= 65 ? 'Low' : idea.score >= 40 ? 'Medium' : 'High';
  return {
    title: idea.title,
    pitch: idea.description,
    audience: '',
    problem: idea.bullets[0] ?? '',
    gap: idea.bullets[1] ?? '',
    differentiation: idea.bullets[2] ?? '',
    closestCompetitors: [],
    mvpFeatures: [],
    mvpRoadmap: [],
    techStack: [],
    firstUsers: [],
    difficulty: idea.score >= 65 ? 'Easy' : idea.score >= 40 ? 'Medium' : 'Hard',
    marketDemand: demand,
    competitionLevel: competition,
    monetizationPotential: demand,
    confidence: idea.score,
  };
}

const slide = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.2 },
};

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.28 },
};

export function OnboardingWizard() {
  const router = useRouter();
  const { user, updateMetadata } = useAuth();

  // ── Shared ──
  const [phase, setPhase] = useState<Phase>('intent');
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Idea path ──
  const [ideaStep, setIdeaStep] = useState<IdeaStep>(1);
  const [idea, setIdea] = useState('');
  const [audience, setAudience] = useState('');
  const [problem, setProblem] = useState('');
  const [ideaResult, setIdeaResult] = useState<QuickValidateResponse | null>(null);

  // ── Explore path ──
  const [interest, setInterest] = useState('');
  const [otherInterest, setOtherInterest] = useState('');
  const [constraints, setConstraints] = useState<string[]>([]);
  const [exploreIdeas, setExploreIdeas] = useState<ExploreIdea[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [carouselDir, setCarouselDir] = useState(1);
  const [hasRefined, setHasRefined] = useState(false);

  function clearMsgInterval() {
    if (msgIntervalRef.current) {
      clearInterval(msgIntervalRef.current);
      msgIntervalRef.current = null;
    }
  }

  function startLoadingMessages() {
    let idx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    msgIntervalRef.current = setInterval(() => {
      idx = Math.min(idx + 1, LOADING_MESSAGES.length - 1);
      setLoadingMsg(LOADING_MESSAGES[idx]);
    }, 700);
  }

  function toggleConstraint(c: string) {
    setConstraints((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function goToCarousel(idx: number) {
    setCarouselDir(idx > carouselIdx ? 1 : -1);
    setCarouselIdx(idx);
  }

  // ── Idea path: analyze ──
  async function analyzeIdea() {
    setError(null);
    setPhase('loading');
    startLoadingMessages();
    try {
      const [res] = await Promise.all([
        fetch('/api/quick-validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: idea.trim(),
            audience: audience.trim(),
            problem: problem.trim(),
          }),
        }),
        wait(3000),
      ]);
      clearMsgInterval();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Analysis failed.');
      }
      setIdeaResult(await res.json());
      setPhase('idea-result');
    } catch (err) {
      clearMsgInterval();
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('idea-collect');
      setIdeaStep(3);
    }
  }

  // ── Explore path: generate (initial or refined) ──
  async function fetchExploreIdeas(previousTitles?: string[]) {
    setPhase('loading');
    startLoadingMessages();
    const effectiveInterest = interest === 'Other' ? otherInterest.trim() : interest;
    try {
      const [res] = await Promise.all([
        fetch('/api/explore-ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interest: effectiveInterest,
            constraints,
            ...(previousTitles?.length ? { previousIdeas: previousTitles } : {}),
          }),
        }),
        wait(3000),
      ]);
      clearMsgInterval();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Exploration failed.');
      }
      const data = await res.json();
      return (data.ideas ?? []) as ExploreIdea[];
    } catch (err) {
      clearMsgInterval();
      throw err;
    }
  }

  async function generateExploreIdeas() {
    setError(null);
    try {
      const ideas = await fetchExploreIdeas();
      setExploreIdeas(ideas);
      setCarouselIdx(0);
      setCarouselDir(1);
      setPhase('explore-results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('constraints');
    }
  }

  // Refinement — allowed exactly once
  async function adjustDirection() {
    if (hasRefined) return;
    const prevTitles = exploreIdeas.map((i) => i.title);
    const savedIdeas = [...exploreIdeas];
    setHasRefined(true);
    setError(null);
    try {
      const ideas = await fetchExploreIdeas(prevTitles);
      setExploreIdeas(ideas);
      setCarouselIdx(0);
      setCarouselDir(1);
      setPhase('explore-results');
    } catch (err) {
      // Restore previous ideas on failure
      setExploreIdeas(savedIdeas);
      setError(err instanceof Error ? err.message : 'Could not refresh ideas.');
      setPhase('explore-results');
    }
  }

  // ── Expansion handlers ──
  async function handleExpandIdea() {
    if (!ideaResult) return;
    setSaving(true);
    useResearchStore.getState().setPrompt(idea.trim());
    useResearchStore.getState().setAutoGenerate(true);
    await updateMetadata({ initial_idea: idea.trim(), onboarding_completed: true });
    router.push('/');
  }

  async function saveAndComplete(picked: ExploreIdea) {
    if (saving || !user) return;
    setSaving(true);
    try {
      await saveIdeaToDB({ userId: user.id, generationId: null, idea: exploreIdeaToIdea(picked) });
      const effectiveInterest = interest === 'Other' ? otherInterest.trim() : interest;
      await updateMetadata({
        initial_idea: picked.title,
        initial_interest: effectiveInterest,
        initial_constraints: constraints,
        onboarding_completed: true,
      });
      router.push('/ideas');
    } catch {
      setSaving(false);
      setError('Could not save your idea. Please try again.');
    }
  }

  // ── Progress dots ──
  const dotsTotal =
    phase === 'idea-collect' ? 3 : phase === 'interest' || phase === 'constraints' ? 2 : 0;
  const dotsFilled =
    phase === 'idea-collect'
      ? ideaStep
      : phase === 'constraints'
        ? 2
        : phase === 'interest'
          ? 1
          : 0;

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

        {/* ── Intent ── */}
        {phase === 'intent' && (
          <motion.div key="intent" {...slide}>
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">What do you want to do?</h1>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  className={cn(choiceBtn(false), 'p-5 text-left')}
                  onClick={() => { setIdeaStep(1); setPhase('idea-collect'); }}
                >
                  <p className="font-semibold text-white/90">I have an idea</p>
                  <p className="mt-0.5 text-xs text-white/35">Analyze and validate a specific idea</p>
                </button>
                <button
                  className={cn(choiceBtn(false), 'p-5 text-left')}
                  onClick={() => setPhase('interest')}
                >
                  <p className="font-semibold text-white/90">I want to explore ideas</p>
                  <p className="mt-0.5 text-xs text-white/35">Discover 3 ideas tailored to your interests</p>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Idea: Collect ── */}
        {phase === 'idea-collect' && (
          <motion.div key={`idea-collect-${ideaStep}`} {...slide}>
            {ideaStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white">What&apos;s your idea?</h1>
                  <p className="mt-2 text-sm text-white/40">Describe what you want to build.</p>
                </div>
                <Textarea
                  rows={4}
                  placeholder="e.g. A tool that helps freelancers track client payments automatically…"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className={cn(fieldInput, 'resize-none')}
                  autoFocus
                />
                <Button
                  className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
                  disabled={!idea.trim()}
                  onClick={() => setIdeaStep(2)}
                >
                  Continue
                </Button>
              </div>
            )}

            {ideaStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white">Who is this for?</h1>
                  <p className="mt-2 text-sm text-white/40">Be as specific as you can.</p>
                </div>
                <Input
                  type="text"
                  placeholder="e.g. freelance designers, remote team leads, solo founders…"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && audience.trim() && setIdeaStep(3)}
                  className={cn(fieldInput, 'h-12')}
                  autoFocus
                />
                <Button
                  className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
                  disabled={!audience.trim()}
                  onClick={() => setIdeaStep(3)}
                >
                  Continue
                </Button>
              </div>
            )}

            {ideaStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white">What problem does it solve?</h1>
                  <p className="mt-2 text-sm text-white/40">What frustration or cost are you fixing?</p>
                </div>
                <Textarea
                  rows={3}
                  placeholder="e.g. Freelancers spend hours chasing late invoices with no automated reminders…"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className={cn(fieldInput, 'resize-none')}
                  autoFocus
                />
                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                <Button
                  className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
                  disabled={!problem.trim()}
                  onClick={analyzeIdea}
                >
                  Analyze my idea →
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Explore: Interest ── */}
        {phase === 'interest' && (
          <motion.div key="interest" {...slide}>
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">What are you interested in?</h1>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map((item) => (
                  <button key={item} onClick={() => setInterest(item)} className={choiceBtn(interest === item)}>
                    {item}
                  </button>
                ))}
              </div>
              {interest === 'Other' && (
                <Input
                  type="text"
                  placeholder="Describe your interest…"
                  value={otherInterest}
                  onChange={(e) => setOtherInterest(e.target.value)}
                  className={cn(fieldInput, 'h-12')}
                  autoFocus
                />
              )}
              <Button
                className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
                disabled={!interest || (interest === 'Other' && !otherInterest.trim())}
                onClick={() => setPhase('constraints')}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Explore: Constraints ── */}
        {phase === 'constraints' && (
          <motion.div key="constraints" {...slide}>
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">What are you looking for?</h1>
                <p className="mt-2 text-sm text-white/40">Pick all that apply.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CONSTRAINTS.map((item) => (
                  <button key={item} onClick={() => toggleConstraint(item)} className={choiceBtn(constraints.includes(item))}>
                    {item}
                  </button>
                ))}
              </div>
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              <Button
                className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
                disabled={constraints.length === 0}
                onClick={generateExploreIdeas}
              >
                Find ideas →
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Loading ── */}
        {phase === 'loading' && (
          <motion.div key="loading" {...fade} className="flex flex-col items-center justify-center gap-10 py-10">
            <div className="relative flex items-center justify-center">
              <div
                className="h-28 w-28 rounded-full animate-pulse"
                style={{ background: 'radial-gradient(circle, rgba(0,119,182,0.5) 0%, rgba(0,119,182,0.08) 60%, transparent 70%)' }}
              />
              <div
                className="absolute h-14 w-14 rounded-full animate-pulse"
                style={{ background: 'radial-gradient(circle, rgba(0,119,182,0.95) 0%, rgba(0,119,182,0.4) 50%, transparent 70%)', animationDelay: '150ms' }}
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMsg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="text-sm text-white/45"
              >
                {loadingMsg}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Idea Result ── */}
        {phase === 'idea-result' && ideaResult && (
          <motion.div key="idea-result" {...fade} className="space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-center"
            >
              <p
                className="text-[5rem] font-black tabular-nums leading-none"
                style={{ color: verdictColor(ideaResult.score) }}
              >
                {ideaResult.score}
              </p>
              <p className="mt-2 text-2xl font-black tracking-widest uppercase" style={{ color: verdictColor(ideaResult.score) }}>
                {ideaResult.verdict}
              </p>
            </motion.div>

            <div className="h-px w-full bg-white/[0.07]" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.4 }}>
              <p className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/25">Why</p>
              <ul className="space-y-2.5">
                {ideaResult.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
                    <span className="mt-0.5 shrink-0 text-[10px] font-bold" style={{ color: verdictColor(ideaResult.score) }}>✓</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </motion.div>

            <div className="h-px w-full bg-white/[0.07]" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, duration: 0.4 }}>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/25">Your next move</p>
              <p className="text-sm leading-relaxed text-white/55">{ideaResult.nextStep}</p>
            </motion.div>

            <div className="h-px w-full bg-white/[0.07]" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.64, duration: 0.4 }}>
              <Button
                className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
                disabled={saving}
                onClick={handleExpandIdea}
              >
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up…</> : 'Improve this idea in dashboard →'}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ── Explore Results (Carousel) ── */}
        {phase === 'explore-results' && exploreIdeas.length > 0 && (
          <motion.div key="explore-results" {...fade} className="space-y-6">
            {/* Card */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={carouselDir}>
                <motion.div
                  key={carouselIdx}
                  custom={carouselDir}
                  variants={{
                    enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-5"
                >
                  {(() => {
                    const card = exploreIdeas[carouselIdx];
                    return (
                      <>
                        <div>
                          <p className="text-base font-bold text-white leading-snug">{card.title}</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-white/55">{card.description}</p>
                        </div>

                        <div className="h-px w-full bg-white/[0.07]" />

                        <div>
                          <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest text-white/25">Why</p>
                          <ul className="space-y-2">
                            {card.bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
                                <span className="mt-0.5 shrink-0 text-[10px] font-bold text-[#0077b6]">✓</span>
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="h-px w-full bg-white/[0.07]" />

                        <div>
                          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/25">Your next move</p>
                          <p className="text-sm leading-relaxed text-white/50">{card.nextStep}</p>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => goToCarousel(carouselIdx - 1)}
                disabled={carouselIdx === 0}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-25 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5">
                {exploreIdeas.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToCarousel(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === carouselIdx ? 'w-6 bg-[#0077b6]' : 'w-1.5 bg-white/20 hover:bg-white/35'
                    )}
                  />
                ))}
              </div>
              <button
                onClick={() => goToCarousel(carouselIdx + 1)}
                disabled={carouselIdx === exploreIdeas.length - 1}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-25 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Primary CTA */}
            <Button
              className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
              disabled={saving}
              onClick={() => saveAndComplete(exploreIdeas[carouselIdx])}
            >
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Start with this idea →'}
            </Button>

            {/* "Not quite right?" section */}
            <div className="text-center space-y-2">
              <p className="text-[11px] text-white/20">Not quite right?</p>
              <div className="flex items-center justify-center gap-4">
                {!hasRefined && (
                  <button
                    onClick={adjustDirection}
                    disabled={saving}
                    className="text-xs text-white/35 underline underline-offset-2 transition-colors hover:text-white/60 disabled:pointer-events-none disabled:opacity-40"
                  >
                    Adjust direction
                  </button>
                )}
                <button
                  onClick={() => saveAndComplete(exploreIdeas[carouselIdx])}
                  disabled={saving}
                  className="text-xs text-white/35 underline underline-offset-2 transition-colors hover:text-white/60 disabled:pointer-events-none disabled:opacity-40"
                >
                  Continue anyway
                </button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
