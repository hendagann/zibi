import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { BlockRenderer } from '@/components/content/BlockRenderer';
import { ExerciseForm } from '@/components/practice/ExerciseForm';
import { FeedbackView } from '@/components/practice/FeedbackView';
import { SchemaView } from '@/components/practice/SchemaView';
import { SqlExerciseForm } from '@/components/practice/SqlExerciseForm';
import { isExercise, isSqlAnswer, type ExerciseItem } from '@/content/exercise';
import { getDataset, getItem } from '@/content/loader';
import { attemptsForItem, LOCAL_USER } from '@/storage/attempts';
import { t } from '@/i18n';

// Attempts accumulate at runtime; this page always reads the store.
export const dynamic = 'force-dynamic';

interface PageProps {
  readonly params: Promise<{ itemId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { itemId } = await params;
  const item = await getItem(itemId);
  return { title: item?.title ?? t.states.notFound.title };
}

export default async function ExercisePage({ params }: PageProps) {
  const { itemId } = await params;
  const item = await getItem(itemId);
  if (!item || !isExercise(item) || item.pool !== 'practice') notFound();
  const exercise = item as ExerciseItem;

  const attempts = await attemptsForItem(LOCAL_USER, itemId);
  const latest = attempts[attempts.length - 1];
  const previous = attempts[attempts.length - 2];
  const topicId = exercise.topic ?? '';

  const isSql = exercise.questionType === 'sql_query';
  const dataset =
    isSql && exercise.sqlSpec ? await getDataset(exercise.sqlSpec.datasetRef) : null;

  return (
    <>
      <PageHeader
        title={exercise.title}
        badge={<Badge tone="neutral">{exercise.id}</Badge>}
      />

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

      {latest ? (
        <Section
          title={t.feedback.title}
          aside={`${t.feedback.historyLabel}: ${attempts.length}`}
        >
          <FeedbackView
            evaluation={latest.evaluation}
            previous={previous?.evaluation}
            topicId={topicId}
          />
        </Section>
      ) : null}

      <Section title={latest ? t.report.revise : isSql ? t.sqlModule.queryLabel : t.report.formTitle}>
        <Card>
          {isSql ? (
            <SqlExerciseForm
              itemId={exercise.id}
              initialSql={
                latest && isSqlAnswer(latest.answer) ? latest.answer.sql : undefined
              }
            />
          ) : (
            <ExerciseForm
              itemId={exercise.id}
              initialAnswer={
                latest && !isSqlAnswer(latest.answer) ? latest.answer : undefined
              }
              diagnosisOptions={exercise.diagnosisOptions}
            />
          )}
        </Card>
      </Section>
    </>
  );
}
