'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OpportunityCard } from '@/components/opportunity/opportunity-card';
import { OpportunityModal } from '@/components/opportunity/opportunity-modal';
import { ThemeToggle } from '@/components/theme-toggle';
import { getSaved } from '@/services/storage.service';
import type { Idea } from '@/types';

export default function SavedPage() {
  const router = useRouter();
  const [ideas,        setIdeas]        = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [mounted,      setMounted]      = useState(false);

  // localStorage is not available on the server — read after mount.
  useEffect(() => {
    setIdeas(getSaved());
    setMounted(true);
  }, []);

  function handleUnsave(title: string) {
    setIdeas((prev) => prev.filter((i) => i.title !== title));
    if (selectedIdea?.title === title) setSelectedIdea(null);
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(0,119,182,0.12)_0%,transparent_70%)]"
      />

      <header className="sticky top-0 z-20 border-b border-border bg-surface-frosted backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" fill="currentColor" />
            <span className="text-sm font-bold text-foreground">Saved Ideas</span>
            {mounted && ideas.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {ideas.length}
              </span>
            )}
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-5 pb-20 pt-10">

        {/* Empty state */}
        {mounted && ideas.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-border py-24 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-primary/[0.06] text-primary">
              <Bookmark className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">No saved ideas yet</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Bookmark ideas from the research results<br />and they'll appear here.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
              Start researching →
            </Button>
          </motion.div>
        )}

        {/* Ideas grid */}
        {mounted && ideas.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-3">
              {ideas.map((idea, i) => (
                <motion.div
                  key={idea.title}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: 'easeOut' }}
                >
                  <OpportunityCard
                    {...idea}
                    onExplore={() => setSelectedIdea(idea)}
                    onUnsave={() => handleUnsave(idea.title)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

      </main>

      <OpportunityModal idea={selectedIdea} onClose={() => setSelectedIdea(null)} />
    </div>
  );
}
