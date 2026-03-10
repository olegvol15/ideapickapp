import { AuthForm } from '@/components/auth/AuthForm';

export default function AuthPage() {
  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,119,182,0.14)_0%,transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-page-grid" />

      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
        <AuthForm />
      </div>
    </div>
  );
}
