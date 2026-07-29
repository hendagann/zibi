import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/states/EmptyState';
import { getExamItems } from '@/content/loader';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.exam.title };

export default async function ExamPage() {
  // Drawn from the exam pool only. The practice pool is never a source for an
  // exam (docs/05 §14), which is why the loader exposes them separately.
  const examItems = await getExamItems();

  return (
    <>
      <PageHeader
        title={t.exam.title}
        subtitle={t.exam.subtitle}
        badge={<Badge tone="info">{t.phase.noticeTitle}</Badge>}
      />

      <Section
        title={t.exam.blueprintsLabel}
        aside={`${t.common.count}: ${examItems.length}`}
      >
        <EmptyState body={t.exam.empty} />
      </Section>

      <Section title={t.exam.historyLabel}>
        <EmptyState body={t.exam.historyEmpty} inline />
      </Section>
    </>
  );
}
