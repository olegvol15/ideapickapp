import { IdeaPickLogo } from '@/components/brand/IdeaPickLogo';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  return (
    <div className="dark relative flex min-h-screen flex-col items-center justify-center bg-[#060d18] px-8 py-12">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 0% 30%, rgba(0,119,182,0.25) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <IdeaPickLogo className="text-white [&>span]:text-[#5ba3f5]" />
        </div>
        <OnboardingWizard />
      </div>
    </div>
  );
}
