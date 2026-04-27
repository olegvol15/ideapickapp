import { IdeaPickLogo } from '@/components/brand/IdeaPickLogo';
import { AuthForm } from '@/components/auth/AuthForm';

const STEPS = [
  {
    n: '01',
    title: 'Generate',
    desc: 'AI-powered idea generation tailored to your interests and market gaps.',
  },
  {
    n: '02',
    title: 'Validate',
    desc: 'Score your idea against real market signals and competitor data.',
  },
  {
    n: '03',
    title: 'Ship',
    desc: 'Turn validated ideas into a structured roadmap and start building.',
  },
];

export default function AuthPage() {
  return (
    <div className="dark flex min-h-screen">
      {/* ── Left panel ── */}
      <div className="relative hidden w-[48%] shrink-0 flex-col justify-between overflow-hidden bg-[#060d18] p-12 lg:flex">
        {/* Deep blue glow — top centre */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 60% at 50% -10%, rgba(0,119,182,0.6) 0%, transparent 60%)',
          }}
        />
        {/* Secondary glow — bottom left */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at -10% 110%, rgba(0,80,140,0.45) 0%, transparent 60%)',
          }}
        />

        {/* Decorative concentric rings — bottom right */}
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-[420px] w-[420px]">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border border-white/[0.04]"
              style={{ transform: `scale(${i * 0.25})`, transformOrigin: 'center' }}
            />
          ))}
        </div>

        {/* Subtle noise texture overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '180px 180px',
          }}
        />

        {/* Logo */}
        <IdeaPickLogo className="relative text-white [&>span]:text-[#5ba3f5]" />

        {/* Centre copy + step list */}
        <div className="relative">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5ba3f5]/70">
            How it works
          </p>
          <h2 className="mb-4 text-[2.4rem] font-bold leading-[1.1] tracking-tight text-white">
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
          <p className="mb-10 text-sm leading-relaxed text-white/45">
            The full stack for startup thinkers — generate,
            <br />
            validate, and roadmap your next big idea.
          </p>

          {/* Vertical timeline */}
          <div className="relative flex flex-col gap-0">
            {/* Connector line */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-[18px] top-6 w-px"
              style={{
                height: 'calc(100% - 2.5rem)',
                background:
                  'linear-gradient(to bottom, rgba(91,163,245,0.5) 0%, rgba(91,163,245,0.1) 100%)',
              }}
            />

            {STEPS.map(({ n, title, desc }, idx) => (
              <div key={n} className={`relative flex gap-5 ${idx < STEPS.length - 1 ? 'pb-7' : ''}`}>
                {/* Step indicator */}
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#5ba3f5]/30 bg-[#0d1f35] text-[11px] font-bold tracking-wider text-[#5ba3f5]">
                  {n}
                </div>

                <div className="pt-1">
                  <p className="mb-0.5 text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs leading-relaxed text-white/40">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-white/20">
          &copy; {new Date().getFullYear()} IdeaPick
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black px-8 py-12">

        {/* Decorative blur orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #0077b6 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #0077b6 0%, transparent 70%)', filter: 'blur(80px)' }}
        />

        {/* Subtle dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Fade dot grid toward edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, black 100%)',
          }}
        />

        {/* Form card */}
        <div className="relative w-full max-w-md">
          {/* Top shimmer line */}
          <div
            aria-hidden
            className="absolute inset-x-0 -top-px h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,119,182,0.5) 40%, rgba(255,255,255,0.15) 50%, rgba(0,119,182,0.5) 60%, transparent)',
            }}
          />

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 shadow-[0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-sm">
            <AuthForm />
          </div>
        </div>
      </div>
    </div>
  );
}
