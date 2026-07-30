import Link from 'next/link';
import type { Topic } from '@/content/types';
import { EmptyState } from '@/components/states/EmptyState';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from './TopicList.module.css';

/**
 * How much of a topic's practice pool the learner has worked through.
 *
 * `done` counts exercises with at least one attempt, matching the green "done"
 * marker in the practice queue — the two surfaces must never disagree about
 * what counts as done, or the same learner state reads as two different
 * numbers. `mastered` is the stricter statement, and it is what turns the ring
 * green: every exercise attempted, and every one of them passed. Coverage and
 * mastery are different claims, so they get different channels rather than one
 * number that means neither.
 */
export interface TopicProgressSummary {
  readonly done: number;
  readonly total: number;
  readonly mastered: boolean;
}

interface TopicListProps {
  readonly topics: readonly Topic[];
  readonly emptyBody?: string;
  /** Keyed by topic id. A topic with no entry renders as untouched. */
  readonly progress?: Readonly<Record<string, TopicProgressSummary>>;
}

/**
 * Renders whatever topics the loader returned.
 *
 * Everything displayed comes from the topic record; nothing about any specific
 * topic is written here (docs/05 §2). In Phase 1 the list is always empty, and
 * the component renders the empty state rather than invented rows.
 */
export function TopicList({ topics, emptyBody, progress }: TopicListProps) {
  if (topics.length === 0) {
    return <EmptyState body={emptyBody ?? t.topics.empty} inline />;
  }

  return (
    <ul className={styles.list} role="list">
      {topics.map((topic) => {
        const summary = progress?.[topic.id];
        const total = summary?.total ?? 0;
        const done = summary?.done ?? 0;
        const percent = total === 0 ? 0 : Math.round((done / total) * 100);
        const mastered = Boolean(summary?.mastered);

        const countClass = [
          styles.count,
          mastered ? styles.countMastered : undefined,
          done === 0 ? styles.countZero : undefined,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li key={topic.id} className={styles.item}>
            <Link href={routes.topic(topic.id)} className={styles.link}>
              <span
                className={[styles.ring, mastered ? styles.ringMastered : undefined]
                  .filter(Boolean)
                  .join(' ')}
                style={{ '--p': percent } as React.CSSProperties}
                // The counter beside it says the same thing in words, so the
                // ring is decoration; announcing it twice would only make the
                // card longer to listen to.
                aria-hidden="true"
              >
                <span className={styles.ringValue}>{total === 0 ? '—' : `${percent}%`}</span>
              </span>

              <span className={styles.body}>
                <span className={styles.name}>{topic.nameHe}</span>
                <span className={countClass}>
                  {total === 0
                    ? t.topics.noExercises
                    : `${mastered ? '✓ ' : ''}${done}/${total} ${t.topics.exercisesShort}`}
                </span>
                <span className={styles.meta}>
                  <span>
                    {t.topics.skillsLabel}: {topic.measuredSkills.length}
                  </span>
                  <span>
                    {t.topic.estimatedTime}: {topic.estimatedMinutes}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
