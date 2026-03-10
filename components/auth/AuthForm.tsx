'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth';

type Mode = 'signin' | 'signup';

interface AuthFormProps {
  /** Called after successful sign-in/up. Defaults to router.push('/') */
  onSuccess?: () => void;
  defaultMode?: Mode;
}

export function AuthForm({ onSuccess, defaultMode = 'signin' }: AuthFormProps) {
  const router            = useRouter();
  const { signIn, signUp }= useAuth();

  const [mode,     setMode]    = useState<Mode>(defaultMode);
  const [email,    setEmail]   = useState('');
  const [password, setPassword]= useState('');
  const [error,    setError]   = useState<string | null>(null);
  const [success,  setSuccess] = useState<string | null>(null);
  const [loading,  setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (result.error) { setError(result.error); return; }

    if (mode === 'signup' && result.requiresEmailConfirmation) {
      setSuccess('Check your email to confirm your account, then sign in.');
      setMode('signin');
      setPassword('');
      return;
    }

    if (onSuccess) onSuccess();
    else router.push('/ideas');
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="font-display text-sm uppercase tracking-[0.25em] text-foreground">
          IDEA<span className="text-primary">PICK</span>
        </span>
        <p className="mt-4 text-xl font-bold text-foreground">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'signin'
            ? 'Sign in to access your saved ideas'
            : 'Start building your idea workspace'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        />

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        {success && (
          <p className="text-xs text-emerald-500">{success}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          className="font-bold text-primary hover:underline"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setSuccess(null);
          }}
        >
          {mode === 'signin' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
