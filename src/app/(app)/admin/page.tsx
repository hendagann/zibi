import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { EmptyState } from '@/components/states/EmptyState';
import { getItems, getTopics } from '@/content/loader';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.admin.overview };

export default async function AdminOverviewPage() {
  const [items, topics] = await Promise.all([getItems(), getTopics()]);

  return (
    <>
      <Section
        title={t.admin.content}
        aside={`${t.common.count}: ${items.length}`}
      >
        <EmptyState body={t.admin.contentEmpty} inline />
      </Section>

      <Section
        title={t.topics.topicsLabel}
        aside={`${t.common.count}: ${topics.length}`}
      >
        <EmptyState body={t.topics.empty} inline />
      </Section>

      <Section title={t.admin.reviewQueue}>
        <EmptyState body={t.admin.reviewQueueEmpty} inline />
      </Section>
    </>
  );
}
