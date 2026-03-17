'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  ChevronDown,
  Gauge,
  LogIn,
  PanelLeftClose,
  Plus,
} from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';
import { IdeaPickLogo } from '@/components/brand/IdeaPickLogo';
import { BrainstormItem } from '@/components/layout/BrainstormItem';
import { ValidationItem } from '@/components/validate/ValidationItem';
import { useAuth } from '@/context/auth';
import { useResearchStore } from '@/stores/research.store';
import { useValidateStore } from '@/stores/validate.store';
import {
  useGetGenerations,
  useDeleteGeneration,
  useRenameGeneration,
} from '@/hooks/use-generations';
import { useGetValidations, useDeleteValidation } from '@/hooks/use-validations';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

function AppSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { openDesktop, setOpenDesktop, setOpenMobile } = useSidebar();
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [validationsOpen, setValidationsOpen] = useState(true);

  const deleteMutation = useDeleteGeneration(user?.id);
  const renameMutation = useRenameGeneration(user?.id);
  const deleteValidationMutation = useDeleteValidation(user?.id);

  // Research recents — logged-in users use React Query, others use Zustand store
  const localHistory = useResearchStore((s) => s.localHistory);
  const { data: dbGenerations } = useGetGenerations(user?.id);
  const recentBrainstorms = user
    ? (dbGenerations ?? []).map((g) => ({ prompt: g.prompt, createdAt: g.id }))
    : localHistory.map((h) => ({
        prompt: h.prompt,
        createdAt: String(h.createdAt),
      }));

  // Validations — logged-in users use React Query, others use Zustand store
  const localValidations = useValidateStore((s) => s.localValidations);
  const removeLocalValidation = useValidateStore((s) => s.removeLocalValidation);
  const { data: dbValidations } = useGetValidations(user?.id);
  const recentValidations = user
    ? (dbValidations ?? []).map((v) => ({ id: v.id, description: v.description }))
    : localValidations.map((v) => ({ id: v.id, description: v.description }));

  function handleNewBrainstorm() {
    useResearchStore.getState().clear();
    onNavigate?.();
    setOpenMobile(false);
    window.location.href = '/';
  }

  const navigation = [
    {
      href: '/validate',
      label: 'Validate Idea',
      icon: Gauge,
      active: pathname === '/validate',
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
      <SidebarHeader className={openDesktop ? 'px-3 py-3' : 'px-2 pt-4'}>
        {openDesktop ? (
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => {
                onNavigate?.();
                setOpenMobile(false);
              }}
              className="flex min-w-0 items-center rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/5"
            >
              <IdeaPickLogo />
            </Link>
            <button
              type="button"
              onClick={() => setOpenDesktop(false)}
              className="hidden h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground lg:flex"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
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
          openDesktop ? 'px-2 py-1' : 'px-2 pt-3'
        )}
      >
        {openDesktop ? (
          <div className="flex flex-col gap-0.5">
            {/* New Brainstorm */}
            <button
              type="button"
              onClick={handleNewBrainstorm}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/6 hover:text-foreground"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/8">
                <Plus className="h-3.5 w-3.5" />
              </span>
              New Brainstorm
            </button>

            {/* Nav items */}
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                    setOpenMobile(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors',
                    item.active
                      ? 'bg-white/8 text-foreground'
                      : 'text-foreground/60 hover:bg-white/5 hover:text-foreground/90'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                      item.active ? 'bg-white/10' : 'bg-white/6'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {item.label}
                </Link>
              );
            })}

            {/* Validations */}
            {recentValidations.length > 0 && (
              <>
                <div className="mx-2 my-3 border-t border-white/8" />

                <button
                  type="button"
                  onClick={() => setValidationsOpen((o) => !o)}
                  className="flex w-full items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                >
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform duration-200',
                      validationsOpen && 'rotate-180'
                    )}
                  />
                  Validations
                </button>

                <AnimatePresence initial={false}>
                  {validationsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      {recentValidations.map((entry) => (
                        <ValidationItem
                          key={entry.id}
                          id={entry.id}
                          description={entry.description}
                          onNavigate={() => {
                            onNavigate?.();
                            setOpenMobile(false);
                          }}
                          onDelete={() => {
                            if (user) {
                              deleteValidationMutation.mutate(entry.id, {
                                onSuccess: () => {
                                  if (pathname === `/validate/${entry.id}`)
                                    router.push('/validate');
                                },
                              });
                            } else {
                              removeLocalValidation(entry.id);
                              if (pathname === `/validate/${entry.id}`)
                                router.push('/validate');
                            }
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Recents */}
            {recentBrainstorms.length > 0 && (
              <>
                <div className="mx-2 my-3 border-t border-white/8" />

                <button
                  type="button"
                  onClick={() => setRecentsOpen((o) => !o)}
                  className="flex w-full items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
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
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      {recentBrainstorms.map((entry, i) => (
                        <BrainstormItem
                          key={entry.createdAt ?? i}
                          id={entry.createdAt}
                          prompt={entry.prompt}
                          onNavigate={() => {
                            onNavigate?.();
                            setOpenMobile(false);
                          }}
                          onDelete={() => {
                            if (user) {
                              deleteMutation.mutate(entry.createdAt, {
                                onSuccess: () => {
                                  if (pathname === `/brainstorms/${entry.createdAt}`)
                                    router.push('/');
                                },
                              });
                            } else {
                              useResearchStore.getState().removeLocalHistory(entry.createdAt);
                              if (pathname === `/brainstorms/${entry.createdAt}`)
                                router.push('/');
                            }
                          }}
                          onRename={(newPrompt) => {
                            if (user) {
                              renameMutation.mutate({ id: entry.createdAt, prompt: newPrompt });
                            } else {
                              useResearchStore
                                .getState()
                                .renameLocalHistory(entry.createdAt, newPrompt);
                            }
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
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
          openDesktop ? 'px-2 pb-4' : 'px-2 pb-4'
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
