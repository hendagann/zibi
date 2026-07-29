import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { BlockRenderer } from '@/components/content/BlockRenderer';
import { ExerciseForm } from '@/components/practice/ExerciseForm';
import { SchemaView } from '@/components/practice/SchemaView';
import { SqlExerciseForm } from '@/components/practice/SqlExerciseForm';
import { isExercise, type ExerciseItem } from '@/content/exercise';
import { getDataset, getItem } from '@/content/loader';
import { answeredCount, computeExamResult, currentSegment } from '@/exam/session';
import { attemptsForSession, LOCAL_USER } from '@/storage/attempts';
import { getSession } from '@/storage/examSessions';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from '@/components/progress/progress.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  readonly params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const session = await getSession(LOCAL_USER, sessionId);
  return { title: session?.title ?? t.exam.title };
}

/**
 * The exam sitting — docs/10 §7.
 *
 * Two states, and only two: answering, or finished. While answering, this page
 * renders the item and nothing else — no score, no verdict, no revision link,
 * because no feedback is released until the exam ends. The `submitExamAnswer`
 * action returns no evaluation at all, so there is nothing here to leak.
 *
 * Progress through the exam is derived from the stored attempts (§7.1), so a
 * reload cannot lose or repeat a question.
 */
export default async function ExamSittingPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await getSession(LOCAL_USER, sessionId);
  if (!session) notFound();

  const attempts = await attemptsForSession(LOCAL_USER, sessionId);
  const result = computeExamResult(session, attempts);
  const answered = answeredCount(session, attempts);
  const total = session.segments.length;

  /* ---------- finished: the score is released, all at once ---------- */
  if (result) {
    return (
      <>
        <PageHeader
          title={session.title}
          subtitle={t.sitting.resultTitle}
          badge={
            <Badge tone={result.passed ? 'success' : 'warning'}>
              {result.passed ? t.sitting.passed : t.sitting.failed}
            </Badge>
          }
        />

        <Section title={t.sitting.resultTitle}>
          <Card>
            <div className={styles.headline}>
              <div className={styles.abilityBlock}>
                <span className={styles.abilityValue}>{result.examScore}</span>
                <span className={styles.abilityLabel}>{t.sitting.examScoreLabel}</span>
                <span className={styles.abilityHint}>{t.sitting.meanNote}</span>
              </div>
              <div className={styles.meanBlock}>
                <span className={styles.meanValue}>{result.passMark}</span>
                <span className={styles.signalLabel}>{t.sitting.passMarkLabel}</span>
              </div>
            </div>
            <p className={styles.signalDetail}>
              {t.sitting.submittedAtLabel}: {result.submittedAt.slice(0, 16).replace('T', ' ')}
            </p>
          </Card>
        </Section>

        <Section title={t.sitting.perSegmentLabel}>
          <Card>
            <ul className={styles.reviewList} role="list">
              {result.perSegment.map((segment) => (
                <li key={segment.segmentId}>
                  {segment.titleHe}: <strong>{segment.score}</strong>
                  {segment.unevaluable ? ` — ${t.sitting.unevaluableNote}` : ''}
                  {' · '}
                  <Link href={`${routes.practice}/${segment.itemId}`}>{segment.itemId}</Link>
                </li>
              ))}
            </ul>
            <p className={styles.signalDetail}>{t.sitting.reviewInPractice}</p>
          </Card>
        </Section>

        <Link href={routes.exam}>{t.sitting.backToExams}</Link>
      </>
    );
  }

  /* ---------- answering ---------- */
  const segment = currentSegment(session, attempts);
  if (!segment) notFound();

  const item = await getItem(segment.itemId);
  if (!item || !isExercise(item)) notFound();
  const exercise = item as ExerciseItem;

  const isSql = exercise.questionType === 'sql_query';
  const dataset =
    isSql && exercise.sqlSpec ? await getDataset(exercise.sqlSpec.datasetRef) : null;

  return (
    <>
      <PageHeader
        title={session.title}
        subtitle={t.sitting.questionOf(answered + 1, total)}
        badge={
          <Badge tone="neutral">
            {t.sitting.answeredLabel}: {answered}/{total}
          </Badge>
        }
      />

      <Section
        title={`${t.sitting.segmentLabel}: ${segment.titleHe}`}
        aside={`${t.sitting.budgetLabel}: ${segment.minutes} ${t.examPlan.minutesLabel}`}
      >
        <Card>
          <p className={styles.signalDetail}>{t.sitting.noFeedbackNotice}</p>
          <p className={styles.signalDetail}>{t.sitting.finalAnswerNotice}</p>
        </Card>
      </Section>

      <Section title={t.content.scenarioLabel}>
        <Card>
          <BlockRenderer blocks={exercise.scenario} />
          <BlockRenderer blocks={exercise.prompt} />
        </Card>
      </Section>

      {isSql && dataset ? (
        <Section title={t.sqlModule.schemaLabel}>
          <Card>
            <SchemaView dataset={dataset} />
          </Card>
        </Section>
      ) : null}

      <Section title={isSql ? t.sqlModule.queryLabel : t.report.formTitle}>
        <Card>
          {isSql ? (
            <SqlExerciseForm itemId={exercise.id} examSessionId={sessionId} />
          ) : (
            <ExerciseForm
              itemId={exercise.id}
              diagnosisOptions={exercise.diagnosisOptions}
              examSessionId={sessionId}
            />
          )}
        </Card>
      </Section>
    </>
  );
}
