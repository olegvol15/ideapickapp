'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AuthForm } from './AuthForm';

interface AuthGateProps {
  open:    boolean;
  onClose: () => void;
}

export function AuthGate({ open, onClose }: AuthGateProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[0_24px_60px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost" size="icon"
              className="absolute right-3 top-3 h-7 w-7 text-muted-foreground"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <AuthForm onSuccess={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hook that manages the AuthGate open/close state. */
export function useAuthGate() {
  const [open, setOpen] = useState(false);
  return {
    open,
    openGate:  () => setOpen(true),
    closeGate: () => setOpen(false),
  };
}
