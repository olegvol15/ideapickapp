'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function GuestSignInCard() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <p className="mb-1 text-[13px] font-semibold text-foreground">
        Save ideas tailored to you
      </p>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        Sign in to save generations, validate ideas, and build your workspace.
      </p>
      <div className="flex gap-2">
        <Button
          asChild
          size="sm"
          className="flex-1 bg-[#0077b6] text-white hover:bg-[#0066a0] text-xs font-medium"
        >
          <Link href="/auth?mode=signup">Sign up</Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="flex-1 text-xs border-white/[0.10] bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
        >
          <Link href="/auth">Log in</Link>
        </Button>
      </div>
    </div>
  );
}
