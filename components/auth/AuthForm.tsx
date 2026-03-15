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
import { FcGoogle } from 'react-icons/fc';
import { PasswordStrength } from './PasswordStrength';
import { SignInSchema, SignUpSchema, ForgotSchema } from '@/lib/schemas/auth';

type Mode = 'signin' | 'signup' | 'forgot';

interface AuthFormProps {
  onSuccess?: () => void;
  defaultMode?: Mode;
}

type SignInData = z.infer<typeof SignInSchema>;
type SignUpData = z.infer<typeof SignUpSchema>;
type ForgotData = z.infer<typeof ForgotSchema>;

const headings: Record<Mode, { title: string; sub: string }> = {
  signin: { title: 'Welcome back', sub: 'Sign in to access your saved ideas' },
  signup: { title: 'Create your account', sub: 'Start building your idea workspace' },
  forgot: { title: 'Reset your password', sub: 'Enter your email to receive a reset link' },
};

export function AuthForm({ onSuccess, defaultMode = 'signin' }: AuthFormProps) {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, resetPasswordForEmail } = useAuth();

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const signinForm = useForm<SignInData>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignUpData>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const forgotForm = useForm<ForgotData>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { email: '' },
  });

  const signupPassword = signupForm.watch('password');

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function handleSignIn(data: SignInData) {
    setError(null);
    setLoading(true);
    const result = await signIn(data.email, data.password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (onSuccess) onSuccess(); else router.push('/ideas');
  }

  async function handleSignUp(data: SignUpData) {
    setError(null);
    setLoading(true);
    const result = await signUp(data.email, data.password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (result.requiresEmailConfirmation) {
      setSuccess('Check your email to confirm your account, then sign in.');
      switchMode('signin');
      return;
    }
    if (onSuccess) onSuccess(); else router.push('/ideas');
  }

  async function handleForgot(data: ForgotData) {
    setError(null);
    setLoading(true);
    const result = await resetPasswordForEmail(data.email);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setSuccess('Reset link sent — check your email.');
  }

  async function handleGoogle() {
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
  }

  const { title, sub } = headings[mode];

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="font-display text-sm uppercase tracking-[0.25em] text-foreground">
          IDEA<span className="text-primary">PICK</span>
        </span>
        <p className="mt-4 text-xl font-bold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </div>

      {/* ── SIGN IN ── */}
      {mode === 'signin' && (
        <form onSubmit={signinForm.handleSubmit(handleSignIn)} className="space-y-3">
          <div>
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...signinForm.register('email')}
            />
            {signinForm.formState.errors.email && (
              <p className="text-xs text-red-500 mt-1">{signinForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
                className="pr-10"
                {...signinForm.register('password')}
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
            {signinForm.formState.errors.password && (
              <p className="text-xs text-red-500 mt-1">{signinForm.formState.errors.password.message}</p>
            )}
            <div className="text-right mt-1">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-emerald-500">{success}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </Button>

          <div className="relative flex items-center gap-2 py-1">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            <FcGoogle className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>
        </form>
      )}

      {/* ── SIGN UP ── */}
      {mode === 'signup' && (
        <form onSubmit={signupForm.handleSubmit(handleSignUp)} className="space-y-3">
          <div>
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...signupForm.register('email')}
            />
            {signupForm.formState.errors.email && (
              <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="new-password"
                className="pr-10"
                {...signupForm.register('password')}
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
            {signupForm.formState.errors.password && (
              <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.password.message}</p>
            )}
            <PasswordStrength password={signupPassword} />
          </div>

          <div>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                autoComplete="new-password"
                className="pr-10"
                {...signupForm.register('confirmPassword')}
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
            {signupForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-emerald-500">{success}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>

          <div className="relative flex items-center gap-2 py-1">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            <FcGoogle className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>
        </form>
      )}

      {/* ── FORGOT ── */}
      {mode === 'forgot' && (
        <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-3">
          <div>
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...forgotForm.register('email')}
            />
            {forgotForm.formState.errors.email && (
              <p className="text-xs text-red-500 mt-1">{forgotForm.formState.errors.email.message}</p>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-emerald-500">{success}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </Button>

          <button
            type="button"
            className="w-full text-xs text-muted-foreground hover:text-primary text-center"
            onClick={() => switchMode('signin')}
          >
            ← Back to sign in
          </button>
        </form>
      )}

      {/* ── MODE TOGGLE ── */}
      {mode !== 'forgot' && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="font-bold text-primary hover:underline"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      )}
    </div>
  );
}

