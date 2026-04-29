'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GuestPromptModalProps {
  open: boolean;
  onClose: () => void;
}

export function GuestPromptModal({ open, onClose }: GuestPromptModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/30 transition-colors hover:text-white/70"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">Get more ideas</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/45">
            You&apos;ve reached your generation limit. Sign up to get unlimited ideas,
            save your workspace, and validate your concepts.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
          >
            <Link href="/auth?mode=signup">Sign up</Link>
          </Button>
          <p className="text-center text-xs text-white/35">
            Already have an account?{' '}
            <Link
              href="/auth"
              className="text-white/60 underline-offset-2 hover:text-white hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
