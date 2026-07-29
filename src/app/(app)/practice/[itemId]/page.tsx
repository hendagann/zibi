import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { BlockRenderer } from '@/components/content/BlockRenderer';
import { ExerciseForm } from '@/components/practice/ExerciseForm';
import { FeedbackView } from '@/components/practice/FeedbackView';
import { isExercise, type ExerciseItem } from '@/content/exercise';
import { getItem } from '@/content/loader';
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

      <Section title={latest ? t.report.revise : t.report.formTitle}>
        <Card>
          <ExerciseForm
            itemId={exercise.id}
            initialAnswer={latest?.answer}
            diagnosisOptions={exercise.diagnosisOptions}
          />
        </Card>
      </Section>
    </>
  );
}
