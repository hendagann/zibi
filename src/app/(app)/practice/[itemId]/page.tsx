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
import { McqExerciseForm } from '@/components/practice/McqExerciseForm';
import { SqlExerciseForm } from '@/components/practice/SqlExerciseForm';
import { StructuredAnswerForm } from '@/components/practice/StructuredAnswerForm';
import {
  isExercise,
  isMcqAnswer,
  isSqlAnswer,
  isStructuredFamily,
  type ExerciseItem,
} from '@/content/exercise';
import type { DefectReportAnswer } from '@/content/blocks';
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
  const isMcq = exercise.questionType === 'mcq_single';
  // The open families render one shared multi-field form, driven by the
  // item's own essaySpec — see StructuredAnswerForm.
  const isStructured = isStructuredFamily(exercise.questionType) && !!exercise.essaySpec;
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
            commonMistakes={exercise.commonMistakes}
            {...(isMcq && exercise.mcqSpec && isMcqAnswer(latest.answer)
              ? {
                  mcqReveal: {
                    spec: exercise.mcqSpec,
                    selectedOptionId: latest.answer.selectedOptionId,
                  },
                }
              : {})}
          />
        </Section>
      ) : null}

      <Section
        title={
          latest
            ? t.report.revise
            : isMcq
              ? t.mcq.chooseOption
              : isSql
                ? t.sqlModule.queryLabel
                : t.report.formTitle
        }
      >
        <Card>
          {isMcq && exercise.mcqSpec ? (
            <McqExerciseForm
              itemId={exercise.id}
              spec={exercise.mcqSpec}
              initialSelectedId={
                latest && isMcqAnswer(latest.answer) ? latest.answer.selectedOptionId : undefined
              }
            />
          ) : isStructured && exercise.essaySpec ? (
            <StructuredAnswerForm
              itemId={exercise.id}
              spec={exercise.essaySpec}
              initialAnswer={
                latest && !isSqlAnswer(latest.answer) && !isMcqAnswer(latest.answer)
                  ? (latest.answer as Readonly<Record<string, string>>)
                  : undefined
              }
            />
          ) : isSql ? (
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
                latest && !isSqlAnswer(latest.answer) && !isMcqAnswer(latest.answer)
                  ? (latest.answer as DefectReportAnswer)
                  : undefined
              }
              diagnosisOptions={exercise.diagnosisOptions}
            />
          )}
        </Card>
      </Section>
    </>
  );
}
