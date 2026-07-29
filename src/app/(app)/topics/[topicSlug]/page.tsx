import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/states/EmptyState';
import { BlockRenderer } from '@/components/content/BlockRenderer';
import type {
  ExerciseItem,
  GuidedExampleItem,
  LessonItem,
  SummaryItem,
} from '@/content/exercise';
import { getItemsByIds, getSkillsForTopic, getTopic } from '@/content/loader';
import { fromTopicSlug, routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from './topic.module.css';

// Content and attempts change at runtime (admin edits, new submissions);
// this page must always reflect the files on disk.
export const dynamic = 'force-dynamic';

interface PageProps {
  readonly params: Promise<{ topicSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topicSlug } = await params;
  const topic = await getTopic(fromTopicSlug(topicSlug));
  return { title: topic?.nameHe ?? t.states.notFound.title };
}

export default async function TopicPage({ params }: PageProps) {
  const { topicSlug } = await params;
  const topic = await getTopic(fromTopicSlug(topicSlug));
  if (!topic) notFound();

  const [skills, refs] = await Promise.all([
    getSkillsForTopic(topic.id),
    getItemsByIds([
      ...(topic.summaryRef ? [topic.summaryRef] : []),
      ...topic.lessonRefs,
      ...topic.exerciseRefs,
    ]),
  ]);

  const summary = refs.find((i) => i.id === topic.summaryRef) as SummaryItem | undefined;
  const lessons = topic.lessonRefs
    .map((id) => refs.find((i) => i.id === id))
    .filter(Boolean) as LessonItem[];
  const exampleIds = lessons.flatMap((lesson) => lesson.guidedExamples);
  const examples = (await getItemsByIds(exampleIds)) as GuidedExampleItem[];
  const exercises = topic.exerciseRefs
    .map((id) => refs.find((i) => i.id === id))
    .filter(Boolean) as ExerciseItem[];

  return (
    <>
      <PageHeader
        title={topic.nameHe}
        subtitle={topic.description}
        badge={<Badge tone="neutral">{topic.id}</Badge>}
      />

      <div className={styles.meta}>
        <span>
          {t.topic.estimatedTime}: {topic.estimatedMinutes} {t.common.minutesShort}
        </span>
        <span className={styles.skills}>
          {t.topic.measuredSkills}:{' '}
          {skills.map((s) => (
            <Badge key={s.id} tone="info">{s.titleHe}</Badge>
          ))}
        </span>
      </div>

      <Section title={t.topic.summary}>
        {summary ? (
          <Card>
            {summary.keyPoints?.length ? (
              <div className={styles.keyPoints}>
                <h3 className={styles.keyPointsTitle}>{t.content.keyPointsLabel}</h3>
                <ul>
                  {summary.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <BlockRenderer blocks={summary.body} />
          </Card>
        ) : (
          <EmptyState body={t.topic.summaryEmpty} inline />
        )}
      </Section>

      <Section title={t.topic.lessons}>
        {lessons.length ? (
          lessons.map((lesson) => (
            <Card key={lesson.id} id={lesson.id}>
              <h3 className={styles.lessonTitle}>{lesson.title}</h3>
              <BlockRenderer blocks={lesson.body} />
            </Card>
          ))
        ) : (
          <EmptyState body={t.topic.lessonsEmpty} inline />
        )}
      </Section>

      <Section title={t.topic.guidedExamples}>
        {examples.length ? (
          examples.map((example) => (
            <Card key={example.id} id={example.id}>
              <h3 className={styles.lessonTitle}>{example.title}</h3>
              <h4 className={styles.exampleLabel}>{t.content.scenarioLabel}</h4>
              <BlockRenderer blocks={example.scenario} />
              <h4 className={styles.exampleLabel}>{t.content.stepsLabel}</h4>
              <ol className={styles.exampleSteps}>
                {example.steps.map((step, i) => (
                  <li key={i}>
                    <p>{step.action}</p>
                    <p className={styles.reasoning}>
                      <strong>{t.content.reasoningLabel}:</strong> {step.reasoning}
                    </p>
                  </li>
                ))}
              </ol>
              <h4 className={styles.exampleLabel}>{t.content.outcomeLabel}</h4>
              <BlockRenderer blocks={example.outcome} />
              {example.commonMistakes?.length ? (
                <>
                  <h4 className={styles.exampleLabel}>{t.content.commonMistakesLabel}</h4>
                  <ul>
                    {example.commonMistakes.map((m, i) => (
                      <li key={i}>
                        {m.mistake}{' '}
                        <span className={styles.reasoning}>
                          ({t.content.whyTemptingLabel}: {m.whyTempting})
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState body={t.topic.guidedExamplesEmpty} inline />
        )}
      </Section>

      <Section
        title={t.topic.exercises}
        aside={`${t.common.count}: ${exercises.length}`}
      >
        {exercises.length ? (
          <ul className={styles.exerciseList} role="list">
            {exercises.map((exercise) => (
              <li key={exercise.id}>
                <Link href={`${routes.practice}/${exercise.id}`} className={styles.exerciseLink}>
                  <span>{exercise.title}</span>
                  <Badge tone="neutral">
                    {Math.round(exercise.estimatedSeconds / 60)} {t.common.minutesShort}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState body={t.topic.exercisesEmpty} inline />
        )}
      </Section>

      <Section title={t.topic.topicExam}>
        {topic.topicExamRef ? (
          <Card variant="quiet">
            <p className={styles.reasoning}>
              {t.exam.title}: {topic.topicExamRef} — {t.common.comingSoon}
            </p>
          </Card>
        ) : (
          <EmptyState body={t.topic.topicExamEmpty} inline />
        )}
      </Section>
    </>
  );
}
