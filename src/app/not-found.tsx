import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { NotFoundState } from '@/components/states/NotFoundState';
import { t } from '@/i18n';

export const metadata: Metadata = {
  title: t.states.notFound.title,
};

export default function NotFound() {
  return (
    <AppShell>
      <NotFoundState />
    </AppShell>
  );
}
