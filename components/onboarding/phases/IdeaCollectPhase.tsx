'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { slide, fieldInput } from '@/constants/onboarding';
import type { IdeaStep } from '@/types/onboarding.types';

interface Props {
  ideaStep: IdeaStep;
  idea: string;
  audience: string;
  problem: string;
  error: string | null;
  setIdea: (v: string) => void;
  setAudience: (v: string) => void;
  setProblem: (v: string) => void;
  setIdeaStep: (s: IdeaStep) => void;
  onAnalyze: () => void;
}

export function IdeaCollectPhase({
  ideaStep, idea, audience, problem, error,
  setIdea, setAudience, setProblem, setIdeaStep, onAnalyze,
}: Props) {
  return (
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
            onClick={onAnalyze}
          >
            Analyze my idea →
          </Button>
        </div>
      )}
    </motion.div>
  );
}
