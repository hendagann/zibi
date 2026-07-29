import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/states/EmptyState';
import { getPracticeExercises } from '@/content/loader';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.practice.title };

export default async function PracticePage() {
  const exercises = await getPracticeExercises();

  return (
    <>
      <PageHeader
        title={t.practice.title}
        subtitle={t.practice.subtitle}
        badge={<Badge tone="info">{t.phase.noticeTitle}</Badge>}
      />

      <Section
        title={t.practice.queueLabel}
        aside={`${t.common.count}: ${exercises.length}`}
      >
        <EmptyState body={t.practice.queueEmpty} />
      </Section>

      <Section title={t.practice.sessionTitle}>
        <EmptyState body={t.practice.empty} inline />
      </Section>
    </>
  );
}
