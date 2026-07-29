import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/states/EmptyState';
import { examTypeLabel, refusalText } from '@/components/exam/refusalText';
import { StartExamButton } from '@/components/exam/StartExamButton';
import { getBlueprints, getExamItems, getSkills } from '@/content/loader';
import { isExercise } from '@/content/exercise';
import type { ExerciseItem } from '@/content/exercise';
import { planExam } from '@/exam/planner';
import { computeProgress } from '@/progress/compute';
import { attemptsForUser, LOCAL_USER } from '@/storage/attempts';
import { t } from '@/i18n';
import styles from '@/components/progress/progress.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: t.exam.title };

/**
 * The exam surface — docs/10.
 *
 * Every blueprint is planned on load, and a blueprint that cannot be assembled
 * says exactly what is missing. It is never shown as merely unavailable: an
 * exam with no explanation is indistinguishable from a broken product, and the
 * one thing this page must never do is offer a partially assembled exam
 * (docs/06 §11 rule 5).
 */
export default async function ExamPage() {
  const [blueprints, examItems, attempts, skills] = await Promise.all([
    getBlueprints(),
    getExamItems(),
    attemptsForUser(LOCAL_USER),
    getSkills(),
  ]);

  const pool = examItems.filter(isExercise) as ExerciseItem[];
  const progress = computeProgress(
    attempts,
    skills.map((s) => s.id),
    { now: new Date(), topicBySkill: Object.fromEntries(skills.map((s) => [s.id, s.topic])) },
  );

  const titleOf = (itemId: string) => pool.find((i) => i.id === itemId)?.title ?? itemId;
  const plans = blueprints.map((blueprint) => ({
    blueprint,
    plan: planExam(blueprint, pool, attempts, {
      now: new Date(),
      skills,
      progress: progress.skills,
    }),
  }));

  if (plans.length === 0) {
    return (
      <>
        <PageHeader title={t.exam.title} subtitle={t.exam.subtitle} />
        <EmptyState body={t.exam.empty} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t.exam.title}
        subtitle={t.exam.subtitle}
        badge={<Badge tone="neutral">{`${t.common.count}: ${plans.length}`}</Badge>}
      />

      {plans.map(({ blueprint, plan }) => (
        <Section
          key={blueprint.id}
          title={blueprint.title}
          aside={`${t.examPlan.typeLabel}: ${examTypeLabel(blueprint.examType)}`}
        >
          <Card>
            <div className={styles.skillHead}>
              <Badge tone={plan.ok ? 'success' : 'warning'}>
                {plan.ok ? t.examPlan.runnable : t.examPlan.notRunnable}
              </Badge>
              <Badge tone="neutral">
                {t.examPlan.totalTimeLabel}: {blueprint.durationMinutes} {t.examPlan.minutesLabel}
              </Badge>
              <Badge tone="neutral">
                {t.examPlan.passMarkLabel}: {blueprint.passMark}
              </Badge>
            </div>

            {plan.ok ? (
              <>
                <p className={styles.signalLabel}>{t.examPlan.planLabel}</p>
                <ul className={styles.reviewList} role="list">
                  {plan.segments.map((segment) => (
                    <li key={segment.segmentId}>
                      {segment.minutes} {t.examPlan.minutesLabel} — {segment.titleHe}:{' '}
                      {titleOf(segment.itemId)}
                      {segment.judgement ? (
                        <>
                          {' '}
                          <Badge tone="info">{t.examPlan.judgementBadge}</Badge>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <p className={styles.signalDetail}>
                  {t.examPlan.openQuestionsLabel}: {plan.openCount}
                </p>
                <StartExamButton blueprintId={blueprint.id} />
              </>
            ) : (
              <div className={styles.reviewBox}>
                <span className={styles.reviewTitle}>{t.examPlan.notRunnableHint}</span>
                <ul className={styles.reviewList}>
                  {plan.reasons.map((reason, index) => (
                    <li key={`${reason.code}-${reason.segmentId ?? index}`}>
                      {reason.segmentId ? `${reason.segmentId} — ` : ''}
                      {refusalText(reason)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </Section>
      ))}

      <Section title={t.exam.historyLabel}>
        <EmptyState body={t.exam.historyEmpty} inline />
      </Section>
    </>
  );
}
