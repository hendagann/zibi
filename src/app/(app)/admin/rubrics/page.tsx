import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { EmptyState } from '@/components/states/EmptyState';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.admin.rubrics };

/**
 * Rubrics are authored data with their own lifecycle (docs/07 §15). No loader
 * exists for them yet, so this surface is structurally empty rather than
 * reading a collection that has not been defined.
 */
export default function AdminRubricsPage() {
  return (
    <Section title={t.admin.rubrics}>
      <EmptyState body={t.admin.rubricsEmpty} />
    </Section>
  );
}
