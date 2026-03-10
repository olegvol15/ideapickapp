'use client';

import { motion } from 'framer-motion';
import { IdeaPickLogo } from '@/components/brand/IdeaPickLogo';
import { AppShell } from '@/components/layout/AppShell';
import { PromptForm } from '@/components/research/PromptForm';

const fadeUp = (delay: number) =>
  ({
    initial:    { opacity: 0, y: 20 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: 'easeOut' },
  }) as const;

export default function Home() {
  return (
    <AppShell>
      <main className="relative mx-auto max-w-3xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <motion.div {...fadeUp(0)} className="mb-16 flex items-center justify-center">
          <IdeaPickLogo compact />
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

          <motion.p
            {...fadeUp(0.2)}
            className="mt-7 text-[1.0625rem] leading-[1.7] text-foreground/70"
          >
            Describe your skills, interests, or problems and get product ideas
            you can actually build.
          </motion.p>
        </div>

        <motion.div {...fadeUp(0.3)} className="mt-16">
          <PromptForm />
        </motion.div>
      </main>
    </AppShell>
  );
}
