import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';

/**
 * Every authenticated-area route renders inside the shell. The route group
 * `(app)` adds no path segment, so URLs stay flat (`/dashboard`, not
 * `/app/dashboard`).
 */
export default function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
