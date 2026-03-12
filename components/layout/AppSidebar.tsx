'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  ChevronDown,
  Clock,
  LogIn,
  PanelLeftClose,
  Plus,
  Sparkles,
} from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';
import { IdeaPickLogo } from '@/components/brand/IdeaPickLogo';
import { useAuth } from '@/context/auth';
import { useRecentBrainstorms } from '@/hooks/use-recent-brainstorms';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

function truncate(text: string, max = 32) {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

function AppSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { openDesktop, setOpenDesktop, setOpenMobile } = useSidebar();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [recentsOpen, setRecentsOpen] = useState(true);
  const { items: recentBrainstorms, restore } = useRecentBrainstorms();

  function handleNewBrainstorm() {
    try {
      localStorage.removeItem('ideapick:last-research');
    } catch {
      /* ignore */
    }
    onNavigate?.();
    setOpenMobile(false);
    window.location.href = '/';
  }

  const navigation = [
    {
      href: '/',
      label: 'Playground',
      icon: Sparkles,
      active: pathname === '/',
    },
    {
      href: '/ideas',
      label: 'Saved ideas',
      icon: Bookmark,
      active: pathname === '/ideas' || pathname === '/saved',
    },
    ...(!user
      ? [
          {
            href: '/auth',
            label: 'Sign in',
            icon: LogIn,
            active: pathname === '/auth',
          },
        ]
      : []),
  ];

  return (
    <>
      <SidebarHeader className={openDesktop ? undefined : 'px-2 pt-4'}>
        {openDesktop ? (
          <div className="flex items-center justify-between gap-2 px-0 py-1">
            <Link
              href="/"
              onClick={() => {
                onNavigate?.();
                setOpenMobile(false);
              }}
              className="flex min-w-0 items-center rounded-xl px-1 py-2 transition-all duration-300 ease-out hover:bg-background/50"
            >
              <IdeaPickLogo />
            </Link>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOpenDesktop(false)}
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-300 ease-out hover:bg-background/60 hover:text-foreground lg:flex"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-1">
            <SidebarTrigger className="h-10 w-10 rounded-xl border-border/80 bg-card/70 shadow-[0_12px_28px_rgba(2,62,138,0.14)] backdrop-blur-xl" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent
        className={cn(
          'bg-card/95 text-card-foreground backdrop-blur-xl',
          openDesktop ? 'pt-4' : 'px-2 pt-3'
        )}
      >
        {openDesktop ? (
          <SidebarGroup className="space-y-3">
            <SidebarGroupLabel className="text-xs font-semibold normal-case tracking-normal text-muted-foreground/85">
              Platform
            </SidebarGroupLabel>

            <button
              type="button"
              onClick={handleNewBrainstorm}
              className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-[0.88rem] font-medium text-foreground/80 transition-all hover:bg-background/70 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              New Brainstorm
            </button>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setWorkspaceOpen((open) => !open)}
                className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[0.98rem] font-medium text-foreground transition-all duration-300 ease-out hover:bg-background/60"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-background/55 text-muted-foreground transition-all duration-300 ease-out group-hover:text-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">Workspace</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ease-out',
                    workspaceOpen && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {workspaceOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, y: -8 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -6 }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 border-l border-border/80 pl-4">
                      <SidebarMenu className="space-y-1">
                        {navigation.map((item) => {
                          const Icon = item.icon;
                          const isPlayground = item.href === '/';
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton
                                asChild
                                isActive={item.active}
                                className={cn(
                                  'rounded-xl px-2.5 py-2 text-[0.95rem] font-medium shadow-none transition-all duration-300 ease-out',
                                  item.active
                                    ? 'bg-primary/12 text-primary'
                                    : 'text-foreground/88 hover:bg-background/50'
                                )}
                              >
                                <Link
                                  href={item.href}
                                  onClick={() => {
                                    onNavigate?.();
                                    setOpenMobile(false);
                                  }}
                                >
                                  <Icon
                                    className={cn(
                                      'h-3.5 w-3.5 transition-colors duration-300 ease-out',
                                      item.active
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                    )}
                                  />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuButton>

                              {/* Recents — nested under Playground */}
                              {isPlayground && recentBrainstorms.length > 0 && (
                                <div className="ml-4 mt-0.5 border-l border-border/60 pl-3">
                                  <button
                                    type="button"
                                    onClick={() => setRecentsOpen((o) => !o)}
                                    className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[0.78rem] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                  >
                                    <ChevronDown
                                      className={cn(
                                        'h-3 w-3 transition-transform duration-200',
                                        recentsOpen && 'rotate-180'
                                      )}
                                    />
                                    Recents
                                  </button>
                                  <AnimatePresence initial={false}>
                                    {recentsOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                          duration: 0.25,
                                          ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className="overflow-hidden"
                                      >
                                        {recentBrainstorms.map((entry, i) => (
                                          <button
                                            key={entry.createdAt ?? i}
                                            type="button"
                                            onClick={() => {
                                              onNavigate?.();
                                              setOpenMobile(false);
                                              restore(entry);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[0.82rem] text-foreground/55 transition-colors hover:bg-background/50 hover:text-foreground"
                                          >
                                            <Clock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                                            <span className="truncate">
                                              {truncate(entry.prompt)}
                                            </span>
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SidebarGroup>
        ) : (
          <SidebarMenu className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.active}
                    className={cn(
                      'justify-center rounded-2xl px-0 py-0',
                      item.active
                        ? 'bg-primary/14 text-primary shadow-[0_14px_34px_var(--brand-hi)]'
                        : 'text-muted-foreground hover:bg-background/55 hover:text-foreground'
                    )}
                  >
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      title={item.label}
                      onClick={() => {
                        onNavigate?.();
                        setOpenMobile(false);
                      }}
                      className="flex h-12 w-12 items-center justify-center"
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-colors duration-300 ease-out',
                          item.active ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter
        className={cn(
          'bg-card/95 backdrop-blur-xl',
          openDesktop ? 'pb-6' : 'px-2 pb-4'
        )}
      >
        <UserMenu variant={openDesktop ? 'sidebar' : 'compact'} />
      </SidebarFooter>
    </>
  );
}

export function AppSidebar() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-surface-frosted lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <IdeaPickLogo compact />
          </Link>

          <SidebarTrigger />
        </div>
      </header>

      <Sidebar>
        <AppSidebarContent />
      </Sidebar>
    </>
  );
}
