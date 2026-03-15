'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { ResetSchema } from '@/lib/schemas/auth';

type ResetData = z.infer<typeof ResetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetData>({
    resolver: zodResolver(ResetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = form.watch('password');

  async function handleSubmit(data: ResetData) {
    setError(null);
    setLoading(true);
    const result = await updatePassword(data.password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.push('/ideas');
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,119,182,0.14)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-page-grid"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
        <div className="mb-8 text-center">
          <span className="font-display text-sm uppercase tracking-[0.25em] text-foreground">
            IDEA<span className="text-primary">PICK</span>
          </span>
          <p className="mt-4 text-xl font-bold text-foreground">Set new password</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account</p>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="New password"
                autoComplete="new-password"
                className="pr-10"
                {...form.register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.password.message}</p>
            )}
            <PasswordStrength password={password} />
          </div>

          <div>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="pr-10"
                {...form.register('confirmPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm(v => !v)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
