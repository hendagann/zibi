import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { TopicList, type TopicProgressSummary } from '@/components/topics/TopicList';
import { getDomains, getTopics } from '@/content/loader';
import { attemptsForUser, LOCAL_USER } from '@/storage/attempts';
import { PASS_THRESHOLD } from '@/progress/compute';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.topics.title };

// Attempts change at runtime, so the map must reflect the log on every request
// rather than a build-time snapshot.
export const dynamic = 'force-dynamic';

export default async function TopicsPage() {
  const [domains, topics, attempts] = await Promise.all([
    getDomains(),
    getTopics(),
    attemptsForUser(LOCAL_USER),
  ]);

  // Best score per item: a learner who scored 40 and then 90 has passed it.
  // Taking the latest instead would let a deliberate re-attempt erase a pass,
  // and taking the first would ignore the improvement the product exists for.
  const bestByItem = new Map<string, number>();
  for (const attempt of attempts) {
    const score = attempt.evaluation.final_score;
    const previous = bestByItem.get(attempt.item_id);
    if (previous === undefined || score > previous) bestByItem.set(attempt.item_id, score);
  }

  const progress: Record<string, TopicProgressSummary> = {};
  for (const topic of topics) {
    const refs = topic.exerciseRefs ?? [];
    const done = refs.filter((id) => bestByItem.has(id)).length;
    const passed = refs.filter((id) => (bestByItem.get(id) ?? -1) >= PASS_THRESHOLD).length;
    progress[topic.id] = {
      done,
      total: refs.length,
      // An empty topic is not a mastered one, however true "all zero of them
      // passed" is arithmetically.
      mastered: refs.length > 0 && passed === refs.length,
    };
  }

  // Grouped by domain so the map reflects the hierarchy in docs/03 rather than
  // a flat list. With no content the loop body never runs and the fallback
  // below is what renders.
  const byDomain = domains.map((domain) => ({
    domain,
    topics: topics.filter((topic) => topic.domain === domain.id),
  }));

  return (
    <>
      <PageHeader title={t.topics.title} subtitle={t.topics.subtitle} />

      {byDomain.length === 0 ? (
        <Section title={t.topics.topicsLabel}>
          <TopicList topics={[]} />
        </Section>
      ) : (
        byDomain.map(({ domain, topics: domainTopics }) => (
          <Section
            key={domain.id}
            title={domain.nameHe}
            description={domain.description}
            aside={`${t.topics.topicsLabel}: ${domainTopics.length}`}
          >
            <TopicList topics={domainTopics} progress={progress} />
          </Section>
        ))
      )}
    </>
  );
}
