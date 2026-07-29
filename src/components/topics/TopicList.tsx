import Link from 'next/link';
import type { Topic } from '@/content/types';
import { EmptyState } from '@/components/states/EmptyState';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from './TopicList.module.css';

interface TopicListProps {
  readonly topics: readonly Topic[];
  readonly emptyBody?: string;
}

/**
 * Renders whatever topics the loader returned.
 *
 * Everything displayed comes from the topic record; nothing about any specific
 * topic is written here (docs/05 §2). In Phase 1 the list is always empty, and
 * the component renders the empty state rather than invented rows.
 */
export function TopicList({ topics, emptyBody }: TopicListProps) {
  if (topics.length === 0) {
    return <EmptyState body={emptyBody ?? t.topics.empty} inline />;
  }

  return (
    <ul className={styles.list} role="list">
      {topics.map((topic) => (
        <li key={topic.id} className={styles.item}>
          <Link href={routes.topic(topic.id)} className={styles.link}>
            <span className={styles.name}>{topic.nameHe}</span>
            <span className={styles.meta}>
              <span>
                {t.topics.skillsLabel}: {topic.measuredSkills.length}
              </span>
              <span>
                {t.topic.estimatedTime}: {topic.estimatedMinutes}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
