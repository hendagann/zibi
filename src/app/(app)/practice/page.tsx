import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/states/EmptyState';
import { getPracticeExercises } from '@/content/loader';
import { attemptsForUser, LOCAL_USER } from '@/storage/attempts';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from './practice-list.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: t.practice.title };

export default async function PracticePage() {
  const [exercises, attempts] = await Promise.all([
    getPracticeExercises(),
    attemptsForUser(LOCAL_USER),
  ]);

  const latestByItem = new Map<string, number>();
  for (const attempt of attempts) {
    latestByItem.set(attempt.item_id, attempt.evaluation.final_score);
  }

  return (
    <>
      <PageHeader title={t.practice.title} subtitle={t.practice.subtitle} />

      <Section
        title={t.practice.queueLabel}
        aside={`${t.common.count}: ${exercises.length}`}
      >
        {exercises.length ? (
          <ul className={styles.list} role="list">
            {exercises.map((exercise) => {
              const score = latestByItem.get(exercise.id);
              return (
                <li key={exercise.id}>
                  <Link
                    href={`${routes.practice}/${exercise.id}`}
                    className={styles.link}
                  >
                    <span className={styles.title}>{exercise.title}</span>
                    <span className={styles.meta}>
                      {score !== undefined ? (
                        <Badge tone={score >= 70 ? 'success' : 'warning'}>
                          {t.feedback.scoreLabel}: {score}
                        </Badge>
                      ) : null}
                      <Badge tone="neutral">
                        {Math.round(exercise.estimatedSeconds / 60)} {t.common.minutesShort}
                      </Badge>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState body={t.practice.queueEmpty} />
        )}
      </Section>
    </>
  );
}
