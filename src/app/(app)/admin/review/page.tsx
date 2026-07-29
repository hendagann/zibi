import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { EmptyState } from '@/components/states/EmptyState';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.admin.reviewQueue };

/**
 * The queue of evaluations flagged `human_review_required` (docs/07 §20).
 * Nothing can be flagged before scoring exists, so the queue is empty.
 */
export default function AdminReviewPage() {
  return (
    <Section title={t.admin.reviewQueue}>
      <EmptyState body={t.admin.reviewQueueEmpty} />
    </Section>
  );
}
