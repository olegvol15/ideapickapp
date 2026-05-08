'use client';

import { createContext, useContext } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SheetOpenContext = createContext(false);

export function Sheet({
  open,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  return (
    <SheetOpenContext.Provider value={open ?? false}>
      <DialogPrimitive.Root open={open} {...props} />
    </SheetOpenContext.Provider>
  );
}

export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  const open = useContext(SheetOpenContext);

  return (
    <DialogPrimitive.Portal forceMount>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Overlay forceMount asChild>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
          </DialogPrimitive.Overlay>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Content forceMount asChild {...props}>
            <motion.div
              className={cn(
                'fixed inset-y-0 right-0 z-50 h-full w-[420px] max-w-[90vw]',
                'border-l border-border bg-card p-6',
                'shadow-[-24px_0_60px_rgba(0,0,0,0.15)]',
                className
              )}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              {children}
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </motion.div>
          </DialogPrimitive.Content>
        )}
      </AnimatePresence>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1.5 pr-6', className)} {...props} />;
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-semibold leading-snug text-foreground', className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}
