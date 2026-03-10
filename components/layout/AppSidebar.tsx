'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  ChevronDown,
  ChevronsUpDown,
  LogIn,
  PanelLeftClose,
  Sparkles,
} from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';
import { IdeaPickLogo } from '@/components/brand/IdeaPickLogo';
import { useAuth } from '@/context/auth';
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

function AppSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { setOpenDesktop, setOpenMobile } = useSidebar();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

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
      <SidebarHeader>
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
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-300 ease-out hover:bg-background/60 hover:text-foreground"
              aria-label="Switch workspace"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setOpenDesktop(false)}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-300 ease-out hover:bg-background/60 hover:text-foreground lg:flex"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-card/95 pt-4 text-card-foreground backdrop-blur-xl">
        <SidebarGroup className="space-y-3">
          <SidebarGroupLabel className="text-xs font-semibold normal-case tracking-normal text-muted-foreground/85">
            Platform
          </SidebarGroupLabel>

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
                  workspaceOpen && 'rotate-180',
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

                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={item.active}
                              className={cn(
                                'rounded-xl px-2.5 py-2 text-[0.95rem] font-medium shadow-none transition-all duration-300 ease-out',
                                item.active
                                  ? 'bg-primary/12 text-primary'
                                  : 'text-foreground/88 hover:bg-background/50',
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
                                    item.active ? 'text-primary' : 'text-muted-foreground',
                                  )}
                                />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
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
      </SidebarContent>

      <SidebarFooter className="bg-card/95 pb-6 backdrop-blur-xl">
        <UserMenu variant="sidebar" />
      </SidebarFooter>
    </>
  );
}

export function AppSidebar() {
  const { openDesktop } = useSidebar();

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

      <AnimatePresence initial={false}>
        {!openDesktop && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-5 top-5 z-40 hidden lg:block"
          >
            <SidebarTrigger className="h-10 w-10 rounded-xl border-border/80 bg-card/90 shadow-[0_16px_40px_rgba(2,62,138,0.14)] backdrop-blur-xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar>
        <AppSidebarContent />
      </Sidebar>
    </>
  );
}
