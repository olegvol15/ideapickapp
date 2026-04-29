import { IdeaPickLogo } from '@/components/brand/IdeaPickLogo';
import { AuthForm } from '@/components/auth/AuthForm';

const STEPS = [
  { n: '1', title: 'Generate', desc: 'AI-powered ideas tailored to your market.' },
  { n: '2', title: 'Validate', desc: 'Score against real market signals.' },
  { n: '3', title: 'Ship', desc: 'Roadmap and start building.' },
];

export default function AuthPage() {
  return (
    // Single unified background — no hard split
    <div className="dark relative flex min-h-screen bg-[#060d18]">
      {/* Full-page blue glow anchored to the left */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 0% 30%, rgba(0,119,182,0.35) 0%, transparent 60%)',
        }}
      />
      {/* Secondary glow — bottom left corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at -5% 100%, rgba(0,80,140,0.3) 0%, transparent 55%)',
        }}
      />
      {/* Right side fades darker — gives the form area breathing room */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 100% 50%, rgba(0,0,0,0.55) 0%, transparent 70%)',
        }}
      />

      {/* ── Left panel ── */}
      <div className="relative hidden w-[46%] shrink-0 flex-col justify-between p-12 lg:flex">
        {/* Logo */}
        <IdeaPickLogo className="relative text-white [&>span]:text-[#5ba3f5]" />

        {/* Bottom content */}
        <div className="relative">
          <h2 className="mb-3 text-[2.2rem] font-bold leading-[1.1] tracking-tight text-white">
            From idea to
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #5ba3f5 0%, #a5c8fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              product
            </span>
            , faster.
          </h2>
          <p className="mb-10 text-sm leading-relaxed text-white/40">
            The full stack for startup thinkers — generate,
            <br />
            validate, and roadmap your next big idea.
          </p>

          {/* Step cards */}
          <div className="flex gap-3">
            {STEPS.map(({ n, title, desc }, i) => (
              <div
                key={n}
                className="flex-1 rounded-xl p-4"
                style={{
                  background: i === 0 ? 'rgba(0,119,182,0.18)' : 'rgba(255,255,255,0.06)',
                  border: i === 0 ? '1px solid rgba(0,119,182,0.45)' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="mb-3 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: i === 0 ? 'rgba(0,119,182,0.5)' : 'rgba(255,255,255,0.10)',
                    color: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {n}
                </div>
                <p
                  className="mb-1 text-[13px] font-semibold"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  {title}
                </p>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: i === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.28)' }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/20">
          &copy; {new Date().getFullYear()} IdeaPick
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="relative flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
