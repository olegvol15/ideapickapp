import { AppShell } from '@/components/layout/AppShell';
import { HomeHero } from '@/components/home/HomeHero';

export default function Home() {
  return (
    <AppShell>
      <main className="relative mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-5 pb-24 pt-14 sm:px-8">
        <HomeHero />
      </main>
    </AppShell>
  );
}
