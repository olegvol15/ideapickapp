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

const fieldInput =
  'bg-[#141414] border border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:border-white/[0.22] transition-colors';

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
    if (onSuccess) onSuccess();
    else router.push('/ideas');
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
    if (onSuccess) onSuccess();
    else router.push('/ideas');
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
    <div className="w-full">
      {/* Heading */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1.5 text-sm text-white/40">{sub}</p>
      </div>

      {/* ── SIGN IN ── */}
      {mode === 'signin' && (
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/[0.10] bg-transparent text-white/60 hover:bg-white/[0.05] hover:text-white/80"
            onClick={handleGoogle}
          >
            <FcGoogle className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-white/[0.07]" />
            <span className="text-xs text-white/25">Or</span>
            <div className="flex-1 border-t border-white/[0.07]" />
          </div>

          <form onSubmit={signinForm.handleSubmit(handleSignIn)} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={fieldInput}
                {...signinForm.register('email')}
              />
              {signinForm.formState.errors.email && (
                <p className="text-xs text-destructive">{signinForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/50">Password</label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`${fieldInput} pr-10`}
                  {...signinForm.register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {signinForm.formState.errors.password && (
                <p className="text-xs text-destructive">{signinForm.formState.errors.password.message}</p>
              )}
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {success && <p className="text-xs text-emerald-500">{success}</p>}

            <Button
              type="submit"
              className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium mt-1"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </div>
      )}

      {/* ── SIGN UP ── */}
      {mode === 'signup' && (
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/[0.10] bg-transparent text-white/60 hover:bg-white/[0.05] hover:text-white/80"
            onClick={handleGoogle}
          >
            <FcGoogle className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-white/[0.07]" />
            <span className="text-xs text-white/25">Or</span>
            <div className="flex-1 border-t border-white/[0.07]" />
          </div>

          <form onSubmit={signupForm.handleSubmit(handleSignUp)} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={fieldInput}
                {...signupForm.register('email')}
              />
              {signupForm.formState.errors.email && (
                <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`${fieldInput} pr-10`}
                  {...signupForm.register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {signupForm.formState.errors.password && (
                <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
              )}
              <PasswordStrength password={signupPassword} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Confirm password</label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`${fieldInput} pr-10`}
                  {...signupForm.register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {success && <p className="text-xs text-emerald-500">{success}</p>}

            <Button
              type="submit"
              className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium mt-1"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>
        </div>
      )}

      {/* ── FORGOT ── */}
      {mode === 'forgot' && (
        <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={fieldInput}
              {...forgotForm.register('email')}
            />
            {forgotForm.formState.errors.email && (
              <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-emerald-500">{success}</p>}

          <Button
            type="submit"
            className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>

          <button
            type="button"
            className="w-full text-xs text-white/30 hover:text-white/60 transition-colors"
            onClick={() => switchMode('signin')}
          >
            ← Back to sign in
          </button>
        </form>
      )}

      {/* ── MODE TOGGLE ── */}
      {mode !== 'forgot' && (
        <p className="mt-7 text-center text-xs text-white/30">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="font-semibold text-white/70 hover:text-white transition-colors"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      )}
    </div>
  );
}
