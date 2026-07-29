import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/states/EmptyState';
import { getTopics } from '@/content/loader';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.dashboard.title };

export default async function DashboardPage() {
  // Reads the real content library. It is empty in Phase 1, so every section
  // renders its empty state — there is no placeholder data anywhere here.
  const topics = await getTopics();

  return (
    <>
      <PageHeader
        title={t.dashboard.title}
        subtitle={t.dashboard.subtitle}
        badge={<Badge tone="info">{t.phase.noticeTitle}</Badge>}
      />

      <Section title={t.dashboard.continueLearning}>
        <EmptyState body={t.dashboard.continueLearningEmpty} inline />
      </Section>

      <Section
        title={t.dashboard.dueForReview}
        aside={`${t.topics.topicsLabel}: ${topics.length}`}
      >
        <EmptyState body={t.dashboard.dueForReviewEmpty} inline />
      </Section>

      <Section title={t.dashboard.readiness}>
        <EmptyState body={t.dashboard.readinessEmpty} inline />
      </Section>

      <Section title={t.dashboard.recentActivity}>
        <EmptyState body={t.dashboard.recentActivityEmpty} inline />
      </Section>
    </>
  );
}
