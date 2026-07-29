import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/states/EmptyState';
import { DimensionBars } from '@/components/progress/DimensionBars';
import { SkillProgressCard } from '@/components/progress/SkillProgressCard';
import { getItems, getSkills, getTopics } from '@/content/loader';
import { computeProgress } from '@/progress/compute';
import { attemptsForUser, LOCAL_USER } from '@/storage/attempts';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from '@/components/progress/progress.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: t.progress.title };

/**
 * The progress report — docs/09.
 *
 * Every figure is recomputed from the attempt log on each request. There is no
 * cached progress record to drift from the evidence, and no page-visit signal
 * anywhere in the inputs.
 */
export default async function ProgressPage() {
  const [attempts, skills, topics, items] = await Promise.all([
    attemptsForUser(LOCAL_USER),
    getSkills(),
    getTopics(),
    getItems(),
  ]);

  const topicBySkill = Object.fromEntries(skills.map((s) => [s.id, s.topic]));
  const estimatedSecondsByItem = Object.fromEntries(
    items.map((item) => [item.id, item.estimatedSeconds]),
  );

  const progress = computeProgress(
    attempts,
    skills.map((s) => s.id),
    { now: new Date(), topicBySkill, estimatedSecondsByItem },
  );

  const skillTitle = (skillId: string) =>
    skills.find((s) => s.id === skillId)?.titleHe ?? skillId;
  const topicName = (topicId: string) =>
    topics.find((tp) => tp.id === topicId)?.nameHe ?? topicId;

  if (progress.skills.length === 0) {
    return (
      <>
        <PageHeader title={t.progress.title} subtitle={t.progress.subtitle} />
        <p className={styles.abilityHint}>{t.progressReport.evidenceNote}</p>
        <EmptyState body={t.progress.empty} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t.progress.title}
        subtitle={t.progress.subtitle}
        badge={
          progress.skillsNeedingReview > 0 ? (
            <Badge tone="warning">
              {t.progressReport.skillsNeedingReview}: {progress.skillsNeedingReview}
            </Badge>
          ) : null
        }
      />
      <p className={styles.abilityHint}>{t.progressReport.evidenceNote}</p>

      <Section
        title={t.progressReport.overallLabel}
        aside={`${t.progressReport.attemptsLabel}: ${progress.totalAttempts}`}
      >
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
      </Section>

      {progress.topics.map((topic) => (
        <Section key={topic.topicId} title={t.progressReport.perTopicLabel}>
          <div className={styles.topicHead}>
            <span className={styles.topicAbility}>{topic.ability}</span>
            <Link href={routes.topic(topic.topicId)}>{topicName(topic.topicId)}</Link>
            <Badge tone="neutral">
              {t.progressReport.attemptsLabel}: {topic.attempts}
            </Badge>
            {topic.needsReview ? (
              <Badge tone="warning">{t.progressReport.needsReviewLabel}</Badge>
            ) : null}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {topic.skills.map((skill) => (
              <SkillProgressCard
                key={skill.skillId}
                skill={skill}
                titleHe={skillTitle(skill.skillId)}
              />
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}
