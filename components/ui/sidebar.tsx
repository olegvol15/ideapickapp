'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarContextValue = {
  openDesktop: boolean;
  setOpenDesktop: React.Dispatch<React.SetStateAction<boolean>>;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

function SidebarProvider({ children, className }: React.ComponentProps<'div'>) {
  const [openDesktop, setOpenDesktop] = React.useState(true);
  const [openMobile, setOpenMobile] = React.useState(false);

  return (
    <SidebarContext.Provider
      value={{ openDesktop, setOpenDesktop, openMobile, setOpenMobile }}
    >
      <div
        data-slot="sidebar-provider"
        className={cn(
          'group/sidebar-wrapper flex min-h-screen w-full',
          className
        )}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({ children, className }: React.ComponentProps<'aside'>) {
  const { openDesktop, openMobile, setOpenMobile } = useSidebar();

  return (
    <>
      <motion.aside
        data-slot="sidebar"
        initial={false}
        animate={{
          width: openDesktop ? 232 : 76,
          opacity: 1,
        }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'relative hidden shrink-0 overflow-visible border-r border-border/70 bg-card/70 lg:block',
          className
        )}
      >
        <div className="sticky top-0 flex h-screen w-full min-w-0 flex-col overflow-visible">
          {children}
        </div>
      </motion.aside>

      <AnimatePresence>
        {openMobile && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.button
              type="button"
              aria-label="Close sidebar overlay"
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={() => setOpenMobile(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            />
            <motion.aside
              data-slot="sidebar-mobile"
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 h-full w-[min(86vw,320px)] border-r border-border/70 bg-card shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="flex h-full flex-col">{children}</div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarInset({ children, className }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn('min-w-0 flex-1 lg:h-screen lg:overflow-y-auto', className)}
    >
      {children}
    </div>
  );
}

function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<'button'>) {
  const { openDesktop, setOpenDesktop, setOpenMobile } = useSidebar();

  return (
    <button
      data-slot="sidebar-trigger"
      type="button"
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all duration-300 ease-out hover:bg-muted',
        className
      )}
      onClick={() => {
        if (window.matchMedia('(min-width: 1024px)').matches) {
          setOpenDesktop(!openDesktop);
          return;
        }
        setOpenMobile(true);
      }}
      aria-label="Open sidebar"
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}

function SidebarHeader({ children, className }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn('shrink-0 px-4 pt-4', className)}
    >
      {children}
    </div>
  );
}

function SidebarContent({ children, className }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('min-h-0 flex-1 overflow-hidden px-4 py-4', className)}
    >
      {children}
    </div>
  );
}

function SidebarFooter({ children, className }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        'relative mt-auto shrink-0 px-4 pb-4 overflow-visible',
        className
      )}
    >
      {children}
    </div>
  );
}

function SidebarGroup({ children, className }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="sidebar-group" className={cn('space-y-3', className)}>
      {children}
    </div>
  );
}

function SidebarGroupLabel({
  children,
  className,
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        'px-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80',
        className
      )}
    >
      {children}
    </div>
  );
}

function SidebarMenu({ children, className }: React.ComponentProps<'ul'>) {
  return (
    <ul data-slot="sidebar-menu" className={cn('space-y-1.5', className)}>
      {children}
    </ul>
  );
}

function SidebarMenuItem({ children, className }: React.ComponentProps<'li'>) {
  return (
    <li data-slot="sidebar-menu-item" className={cn(className)}>
      {children}
    </li>
  );
}

type SidebarMenuButtonProps = React.ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
};

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? React.Fragment : 'button';

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<{
      className?: string;
    }>;

    return React.cloneElement(child, {
      className: cn(
        'group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all',
        isActive
          ? 'bg-primary text-primary-foreground shadow-[0_14px_34px_var(--brand-hi)]'
          : 'text-foreground/88 hover:bg-background/60 hover:text-foreground',
        child.props.className,
        className
      ),
    });
  }

  return (
    <Comp
      data-slot="sidebar-menu-button"
      className={cn(
        'group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all',
        isActive
          ? 'bg-primary text-primary-foreground shadow-[0_14px_34px_var(--brand-hi)]'
          : 'text-foreground/88 hover:bg-background/60 hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
