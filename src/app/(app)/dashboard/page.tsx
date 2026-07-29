import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/states/EmptyState';
import { DimensionBars } from '@/components/progress/DimensionBars';
import { reviewReasonText } from '@/components/progress/reviewReason';
import { getItems, getSkills, getTopics } from '@/content/loader';
import { computeProgress } from '@/progress/compute';
import { attemptsForUser, LOCAL_USER } from '@/storage/attempts';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from '@/components/progress/progress.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: t.dashboard.title };

export default async function DashboardPage() {
  const [attempts, skills, topics, items] = await Promise.all([
    attemptsForUser(LOCAL_USER),
    getSkills(),
    getTopics(),
    getItems(),
  ]);

  const progress = computeProgress(
    attempts,
    skills.map((s) => s.id),
    {
      now: new Date(),
      topicBySkill: Object.fromEntries(skills.map((s) => [s.id, s.topic])),
      estimatedSecondsByItem: Object.fromEntries(
        items.map((item) => [item.id, item.estimatedSeconds]),
      ),
    },
  );

  const skillTitle = (skillId: string) =>
    skills.find((s) => s.id === skillId)?.titleHe ?? skillId;
  const needingReview = progress.skills.filter((s) => s.needsReview);
  const recent = [...attempts]
    .filter((a) => !a.evaluation.unevaluable)
    .sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at))
    .slice(0, 5);

  return (
    <>
      <PageHeader title={t.dashboard.title} subtitle={t.dashboard.subtitle} />

      <Section title={t.dashboard.readiness}>
        {progress.ability === null ? (
          <EmptyState body={t.dashboard.readinessEmpty} inline />
        ) : (
          <Card>
            <div className={styles.headline}>
              <div className={styles.abilityBlock}>
                <span className={styles.abilityValue}>{progress.ability}</span>
                <span className={styles.abilityLabel}>{t.progressReport.abilityLabel}</span>
                <span className={styles.abilityHint}>{t.progressReport.abilityHint}</span>
              </div>
            </div>
            <div style={{ marginBlockStart: 'var(--space-5)' }}>
              <DimensionBars dimensions={progress.dimensions} />
            </div>
          </Card>
        )}
      </Section>

      <Section
        title={t.dashboard.dueForReview}
        aside={`${t.progressReport.skillsNeedingReview}: ${needingReview.length}`}
      >
        {needingReview.length === 0 ? (
          <EmptyState body={t.dashboard.dueForReviewEmpty} inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {needingReview.map((skill) => (
              <Card key={skill.skillId}>
                <div className={styles.skillHead}>
                  <span className={styles.skillName}>{skillTitle(skill.skillId)}</span>
                  <Badge tone="warning">{skill.ability}</Badge>
                  {skill.topicId ? (
                    <Link href={routes.topic(skill.topicId)}>
                      {t.progressReport.reviseHere}
                    </Link>
                  ) : null}
                </div>
                <ul className={styles.reviewList}>
                  {skill.reviewReasons.map((reason) => (
                    <li key={reason.code}>{reviewReasonText(reason)}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title={t.dashboard.continueLearning} aside={`${t.topics.topicsLabel}: ${topics.length}`}>
        {topics.length === 0 ? (
          <EmptyState body={t.dashboard.continueLearningEmpty} inline />
        ) : (
          <ul className={styles.reviewList} role="list">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link href={routes.topic(topic.id)}>{topic.nameHe}</Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t.dashboard.recentActivity}>
        {recent.length === 0 ? (
          <EmptyState body={t.dashboard.recentActivityEmpty} inline />
        ) : (
          <ul className={styles.reviewList} role="list">
            {recent.map((attempt) => (
              <li key={attempt.attempt_id}>
                <Link href={`${routes.practice}/${attempt.item_id}`}>
                  {attempt.item_id}
                </Link>
                {' — '}
                {t.feedback.scoreLabel}: {attempt.evaluation.final_score}
                {' · '}
                {t.feedback.attemptLabel} {attempt.attempt_number}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
