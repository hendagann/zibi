import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/states/EmptyState';
import { getSkills, getTopics } from '@/content/loader';
import { attemptsForUser, LOCAL_USER } from '@/storage/attempts';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from './progress.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: t.progress.title };

interface SkillEvidence {
  skillId: string;
  titleHe: string;
  topicId: string;
  attempts: number;
  best: number;
  latest: number;
  previous: number | null;
}

/**
 * Progress is an evidence summary over stored evaluations: attempts, best and
 * latest per-skill scores from `per_skill_scores` (docs/07 §18). It reports
 * demonstrated performance only — no mastery model is claimed, because
 * docs/09 does not exist yet (D-07-2), and no page-completion signal exists
 * anywhere here by design (docs/03 §1).
 */
export default async function ProgressPage() {
  const [attempts, skills, topics] = await Promise.all([
    attemptsForUser(LOCAL_USER),
    getSkills(),
    getTopics(),
  ]);

  const evaluated = attempts.filter((a) => !a.evaluation.unevaluable);

  const bySkill = new Map<string, number[]>();
  for (const attempt of evaluated) {
    for (const [skillId, score] of Object.entries(attempt.evaluation.per_skill_scores)) {
      const list = bySkill.get(skillId) ?? [];
      list.push(score);
      bySkill.set(skillId, list);
    }
  }

  const rows: SkillEvidence[] = [...bySkill.entries()].map(([skillId, scores]) => {
    const skill = skills.find((s) => s.id === skillId);
    return {
      skillId,
      titleHe: skill?.titleHe ?? skillId,
      topicId: skill?.topic ?? '',
      attempts: scores.length,
      best: Math.round(Math.max(...scores) * 100),
      latest: Math.round((scores[scores.length - 1] ?? 0) * 100),
      previous: scores.length > 1 ? Math.round((scores[scores.length - 2] ?? 0) * 100) : null,
    };
  });

  const topicRows = topics
    .map((topic) => ({
      topic,
      skills: rows.filter((r) => r.topicId === topic.id),
    }))
    .filter((entry) => entry.skills.length > 0);

  return (
    <>
      <PageHeader title={t.progress.title} subtitle={t.progress.subtitle} />
      <p className={styles.note}>{t.progressReport.evidenceNote}</p>

      <Section title={t.progressReport.perTopicLabel}>
        {topicRows.length ? (
          topicRows.map(({ topic, skills: topicSkills }) => (
            <Card key={topic.id}>
              <h3 className={styles.topicTitle}>
                <Link href={routes.topic(topic.id)}>{topic.nameHe}</Link>
              </h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{t.progressReport.skillLabel}</th>
                    <th scope="col">{t.progressReport.attemptsLabel}</th>
                    <th scope="col">{t.progressReport.bestLabel}</th>
                    <th scope="col">{t.progressReport.latestLabel}</th>
                    <th scope="col">{t.progressReport.trendLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {topicSkills.map((row) => (
                    <tr key={row.skillId}>
                      <td>{row.titleHe}</td>
                      <td>{row.attempts}</td>
                      <td>{row.best}%</td>
                      <td>{row.latest}%</td>
                      <td>
                        {row.previous === null ? (
                          '—'
                        ) : row.latest > row.previous ? (
                          <Badge tone="success">{t.progressReport.trendUp}</Badge>
                        ) : row.latest < row.previous ? (
                          <Badge tone="danger">{t.progressReport.trendDown}</Badge>
                        ) : (
                          <Badge tone="neutral">{t.progressReport.trendFlat}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))
        ) : (
          <EmptyState body={t.progress.empty} />
        )}
      </Section>

      <Section title={t.progress.history} aside={`${t.common.count}: ${evaluated.length}`}>
        {evaluated.length ? (
          <Card variant="flush">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t.topic.exercises}</th>
                  <th scope="col">{t.feedback.attemptLabel}</th>
                  <th scope="col">{t.feedback.scoreLabel}</th>
                </tr>
              </thead>
              <tbody>
                {[...evaluated].reverse().map((attempt) => (
                  <tr key={attempt.attempt_id}>
                    <td>
                      <Link href={`${routes.practice}/${attempt.item_id}`}>
                        {attempt.item_id}
                      </Link>
                    </td>
                    <td>{attempt.attempt_number}</td>
                    <td>{attempt.evaluation.final_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <EmptyState body={t.progress.historyEmpty} inline />
        )}
      </Section>
    </>
  );
}
