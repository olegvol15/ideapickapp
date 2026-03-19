'use client';

import { ValidateForm } from '@/components/validate/ValidateForm';

export default function ValidatePage() {
  return (
    <main className="relative mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-5 pb-24 pt-14 sm:px-8">
      <div className="mx-auto w-full max-w-xl text-center mb-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Validate Your Idea
        </h1>
        <p className="mt-3 text-[1.0625rem] leading-[1.7] text-foreground/70">
          Describe your idea and get a research-backed validation report with real market signals.
        </p>
      </div>

      <ValidateForm />
    </main>
  );
}
