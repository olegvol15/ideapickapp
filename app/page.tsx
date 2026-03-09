"use client";

import { motion } from "framer-motion";
import { PromptForm } from "@/components/research/PromptForm";
import { ThemeToggle } from "@/components/theme-toggle";

const fadeUp = (delay: number) =>
  ({
    initial:    { opacity: 0, y: 20 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: "easeOut" },
  }) as const;

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      {/* Blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px]"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,119,182,0.18) 0%, rgba(144,224,239,0.08) 45%, transparent 70%)",
        }}
      />

      {/* Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize:    "48px 48px",
          maskImage:         "radial-gradient(ellipse 90% 80% at 50% 35%, black 20%, transparent 70%)",
          WebkitMaskImage:   "radial-gradient(ellipse 90% 80% at 50% 35%, black 20%, transparent 70%)",
        }}
      />

      {/* Bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
        style={{ background: "linear-gradient(to bottom, transparent, var(--bg))" }}
      />

      {/* Theme toggle */}
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <main className="relative mx-auto max-w-3xl px-5 pb-32 pt-20 sm:pt-28">
        {/* Brand mark */}
        <motion.div {...fadeUp(0)} className="mb-16 flex items-center justify-center">
          <span
            className="text-sm uppercase tracking-[0.25em]"
            style={{ fontFamily: "var(--font-anton)", color: "var(--text-1)" }}
          >
            IDEA<span style={{ color: "var(--accent)" }}>PICK</span>
          </span>
        </motion.div>

        {/* Hero */}
        <div className="mx-auto max-w-xl text-center">
          <motion.h1
            {...fadeUp(0.1)}
            className="text-5xl uppercase leading-[1.1] sm:text-6xl"
            style={{ fontFamily: "var(--font-anton)", color: "var(--text-1)" }}
          >
            Generate startup ideas
            <br />
            <span style={{ color: "var(--accent)" }}>with AI</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="mt-7 text-[1.0625rem] leading-[1.7]"
            style={{ color: "var(--text-2)" }}
          >
            Describe your skills, interests, or problems and get product ideas
            you can actually build.
          </motion.p>
        </div>

        {/* Form */}
        <motion.div {...fadeUp(0.3)} className="mt-16">
          <PromptForm />
        </motion.div>
      </main>
    </div>
  );
}
