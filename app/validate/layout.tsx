import { AppShell } from '@/components/layout/AppShell';

export default function ValidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
