import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/states/EmptyState';
import { getTopic } from '@/content/loader';
import { fromTopicSlug } from '@/lib/routes';
import { t } from '@/i18n';

interface PageProps {
  readonly params: Promise<{ topicSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { topicSlug } = await params;
  const topic = await getTopic(fromTopicSlug(topicSlug));
  return { title: topic?.nameHe ?? t.states.notFound.title };
}

export default async function TopicPage({ params }: PageProps) {
  const { topicSlug } = await params;
  const topic = await getTopic(fromTopicSlug(topicSlug));

  // With an empty library every topic URL is a miss. `notFound()` is the
  // correct response — an empty shell page would claim the topic exists.
  if (!topic) notFound();

  return (
    <>
      <PageHeader
        title={topic.nameHe}
        subtitle={topic.description}
        badge={<Badge tone="neutral">{topic.id}</Badge>}
      />

      <Section title={t.topic.summary}>
        {topic.summaryRef ? null : (
          <EmptyState body={t.topic.summaryEmpty} inline />
        )}
      </Section>

      <Section
        title={t.topic.lessons}
        aside={`${t.common.count}: ${topic.lessonRefs.length}`}
      >
        <EmptyState body={t.topic.lessonsEmpty} inline />
      </Section>

      <Section title={t.topic.guidedExamples}>
        <EmptyState body={t.topic.guidedExamplesEmpty} inline />
      </Section>

      <Section
        title={t.topic.exercises}
        aside={`${t.common.count}: ${topic.exerciseRefs.length}`}
      >
        <EmptyState body={t.topic.exercisesEmpty} inline />
      </Section>

      <Section title={t.topic.topicExam}>
        <EmptyState body={t.topic.topicExamEmpty} inline />
      </Section>
    </>
  );
}
