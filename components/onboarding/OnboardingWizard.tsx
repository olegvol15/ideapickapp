'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

const ROLES = [
  'Solo developer',
  'Designer',
  'Product manager',
  'Founder / entrepreneur',
  'Student',
  'Just exploring',
];

const INTERESTS = [
  'SaaS product',
  'Mobile app',
  'Developer tool',
  'Content / media',
  'E-commerce',
  'Not sure yet',
];

const fieldInput =
  'bg-[#141414] border border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:border-white/[0.22] transition-colors text-center text-base h-12';

export function OnboardingWizard() {
  const router = useRouter();
  const { updateMetadata } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  async function finish(skipInterests = false) {
    setLoading(true);
    const result = await updateMetadata({
      display_name: name,
      role,
      interests: skipInterests ? [] : interests,
      onboarding_completed: true,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push('/');
  }

  return (
    <div className="w-full">
      {/* Step indicator */}
      <div className="mb-10 flex items-center justify-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={cn(
              'h-1 w-10 rounded-full transition-all duration-300',
              step >= s ? 'bg-[#0077b6]' : 'bg-white/[0.10]'
            )}
          />
        ))}
      </div>

      {/* ── Step 1: Name ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">What should we call you?</h1>
            <p className="mt-2 text-sm text-white/40">Just your first name is fine.</p>
          </div>
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(2)}
            className={fieldInput}
            autoFocus
          />
          <Button
            className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
            disabled={!name.trim()}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {/* ── Step 2: Role ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">What best describes you?</h1>
            <p className="mt-2 text-sm text-white/40">We'll tailor ideas to your background.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  'rounded-xl border px-4 py-3 text-sm text-left transition-colors',
                  role === r
                    ? 'border-[#0077b6] bg-[#0077b6]/20 text-white'
                    : 'border-white/[0.08] bg-[#141414] text-white/45 hover:border-white/[0.18] hover:text-white/75'
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Button
            className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
            disabled={!role}
            onClick={() => setStep(3)}
          >
            Continue
          </Button>
        </div>
      )}

      {/* ── Step 3: Interests ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">What do you want to build?</h1>
            <p className="mt-2 text-sm text-white/40">Pick as many as you like.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={cn(
                  'rounded-xl border px-4 py-3 text-sm text-left transition-colors',
                  interests.includes(interest)
                    ? 'border-[#0077b6] bg-[#0077b6]/20 text-white'
                    : 'border-white/[0.08] bg-[#141414] text-white/45 hover:border-white/[0.18] hover:text-white/75'
                )}
              >
                {interest}
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
          <Button
            className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
            disabled={loading}
            onClick={() => finish(false)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get started
          </Button>
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={loading}
            className="w-full text-xs text-white/25 hover:text-white/50 transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
