'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ChevronsUpDown, LogOut, Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/auth';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  variant?: 'compact' | 'sidebar';
}

export function UserMenu({ variant = 'compact' }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) {
    return variant === 'sidebar' ? (
      <Link
        href="/auth"
        className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-background/35"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
          <LogOut className="h-3.5 w-3.5 rotate-180" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-none text-foreground">Sign in</span>
          <span className="block text-xs text-muted-foreground">Access your saved ideas</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    ) : null;
  }

  const email = user.email ?? '';
  const initials = email[0]?.toUpperCase() ?? '?';
  const displayName = email.split('@')[0] || 'Account';
  const isDark = resolvedTheme === 'dark';
  const appearanceLabel = !mounted
    ? 'Theme'
    : theme === 'system'
      ? `System (${isDark ? 'Dark' : 'Light'})`
      : isDark
        ? 'Dark'
        : 'Light';

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  function handleToggleTheme() {
    if (!mounted) return;
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'transition-all',
          variant === 'compact'
            ? 'flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-2 ring-transparent hover:ring-primary/30'
            : 'flex w-full items-center gap-2.5 rounded-xl px-1 py-1.5 text-left hover:bg-background/35',
        )}
        title={email}
      >
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-primary/12 font-bold text-primary',
            variant === 'compact' ? 'h-8 w-8 text-[11px]' : 'h-9 w-9 text-xs',
          )}
        >
          {initials}
        </span>
        {variant === 'sidebar' && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-none text-foreground">
                {displayName}
              </span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {email}
              </span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
        {variant === 'compact' && <span className="sr-only">Open user menu</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_32px_rgba(0,0,0,0.15)]',
              variant === 'compact'
                ? 'right-0 top-10 w-52'
                : 'bottom-[calc(100%+0.75rem)] left-0 w-full min-w-[240px]',
            )}
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-[11px] text-muted-foreground">{email}</p>
            </div>

            <div className="p-1">
              <button
                type="button"
                onClick={handleToggleTheme}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">Appearance</span>
                  <span className="block text-xs text-muted-foreground">{appearanceLabel}</span>
                </span>
              </button>
            </div>

            <div className="border-t border-border p-1">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
