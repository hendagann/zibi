import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { TopicList } from '@/components/topics/TopicList';
import { getDomains, getTopics } from '@/content/loader';
import { t } from '@/i18n';

export const metadata: Metadata = { title: t.topics.title };

export default async function TopicsPage() {
  const [domains, topics] = await Promise.all([getDomains(), getTopics()]);

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
            <TopicList topics={domainTopics} />
          </Section>
        ))
      )}
    </>
  );
}
