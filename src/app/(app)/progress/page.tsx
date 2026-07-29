import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/states/EmptyState';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.progress.title };

/**
 * Progress reports demonstrated ability, never pages visited (docs/03 §1).
 * There are no attempts yet and no progress model, so every panel is empty —
 * a zero here would be a claim about the learner that no evidence supports.
 */
export default function ProgressPage() {
  return (
    <>
      <PageHeader
        title={t.progress.title}
        subtitle={t.progress.subtitle}
        badge={<Badge tone="info">{t.phase.noticeTitle}</Badge>}
      />

      <Section title={t.progress.byDomain}>
        <EmptyState body={t.progress.empty} />
      </Section>

      <Section title={t.progress.bySkill}>
        <EmptyState body={t.progress.empty} inline />
      </Section>

      <Section title={t.progress.history}>
        <EmptyState body={t.progress.historyEmpty} inline />
      </Section>
    </>
  );
}
