import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { EmptyState } from '@/components/states/EmptyState';
import { getItems } from '@/content/loader';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.admin.content };

export default async function AdminContentPage() {
  const items = await getItems();

  return (
    <Section
      title={t.admin.content}
      aside={`${t.common.count}: ${items.length}`}
    >
      <EmptyState body={t.admin.contentEmpty} />
    </Section>
  );
}
