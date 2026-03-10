'use client';

import { motion } from 'framer-motion';
import { PromptForm } from '@/components/research/PromptForm';
import { ThemeToggle } from '@/components/theme-toggle';

const fadeUp = (delay: number) =>
  ({
    initial:    { opacity: 0, y: 20 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: 'easeOut' },
  }) as const;

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,119,182,0.18)_0%,rgba(144,224,239,0.08)_45%,transparent_70%)]"
      />

      <div aria-hidden className="pointer-events-none absolute inset-0 bg-page-grid" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(to_bottom,transparent,var(--bg))]"
      />

      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <main className="relative mx-auto max-w-3xl px-5 pb-32 pt-20 sm:pt-28">
        <motion.div {...fadeUp(0)} className="mb-16 flex items-center justify-center">
          <span className="font-display text-sm uppercase tracking-[0.25em] text-foreground">
            IDEA<span className="text-primary">PICK</span>
          </span>
        </motion.div>

        <div className="mx-auto max-w-xl text-center">
          <motion.h1
            {...fadeUp(0.1)}
            className="font-display text-5xl uppercase leading-[1.1] text-foreground sm:text-6xl"
          >
            Generate startup ideas
            <br />
            <span className="text-primary">with AI</span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="mt-7 text-[1.0625rem] leading-[1.7] text-foreground/70">
            Describe your skills, interests, or problems and get product ideas
            you can actually build.
          </motion.p>
        </div>

        <motion.div {...fadeUp(0.3)} className="mt-16">
          <PromptForm />
        </motion.div>
      </main>
    </div>
  );
}
