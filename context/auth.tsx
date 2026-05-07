'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useResearchStore } from '@/stores/research.store';
import { saveGeneration } from '@/services/db.service';

interface AuthResult {
  error: string | null;
  requiresEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPasswordForEmail: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  updateMetadata: (data: Record<string, unknown>) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (event === 'SIGNED_IN' && newUser) {
        const state = useResearchStore.getState();
        if (state.result && !state.generationId) {
          saveGeneration({
            userId: newUser.id,
            prompt: state.prompt,
            productType: state.productType,
            difficulty: state.difficulty,
            result: state.result,
          })
            .then((savedId) => {
              if (savedId) useResearchStore.getState().setResult(state.result!, savedId);
            })
            .catch(() => null);
        }
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error?.message === 'User already registered') {
      return {
        error: 'An account with this email already exists. Try signing in.',
      };
    }
    return {
      error: error?.message ?? null,
      requiresEmailConfirmation: !error && !data.session,
    };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function signInWithGoogle(): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
    return { error: error?.message ?? null };
  }

  async function resetPasswordForEmail(email: string): Promise<AuthResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        window.location.origin + '/auth/callback?next=/auth/reset-password',
    });
    return { error: error?.message ?? null };
  }

  async function updatePassword(password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }

  async function updateMetadata(data: Record<string, unknown>): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({ data });
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPasswordForEmail,
        updatePassword,
        updateMetadata,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
