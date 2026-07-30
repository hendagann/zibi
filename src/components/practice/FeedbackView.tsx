import Link from 'next/link';
import type { ItemCommonMistake } from '@/content/exercise';
import type { McqItemSpec } from '@/scoring/mcqEngine';
import type { EvaluationResult } from '@/scoring/types';
import { routes } from '@/lib/routes';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { t } from '@/i18n';
import styles from './practice.module.css';

/**
 * Deterministic feedback rendering — the fallback path of docs/08 §6,
 * assembled directly from the evaluation result. Every statement here traces
 * to a field of the result: evidence spans, missing component labels,
 * critical-error labels, and the rubric's remediation anchors. There is no
 * generated prose, so nothing can contradict the score it presents.
 */

function remediationHref(topicId: string, remediation: { ref: string; anchor?: string }): string {
  const anchor = remediation.anchor ?? remediation.ref;
  return `${routes.topic(topicId)}#${anchor}`;
}

function LevelBar({ level }: { level: number }) {
  return (
    <span className={styles.levelBar} aria-label={`${t.feedback.levelLabel} ${level}/4`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={[styles.levelDot, i <= level ? styles.levelDotOn : undefined]
            .filter(Boolean)
            .join(' ')}
        />
      ))}
    </span>
  );
}

interface FeedbackViewProps {
  readonly evaluation: EvaluationResult;
  readonly previous?: EvaluationResult | undefined;
  readonly topicId: string;
  /**
   * The item's authored common mistakes (docs/06 §6.3). Shown only here, after
   * an attempt exists — before submission they would hand over the answer, and
   * during an exam no feedback is released at all (docs/10 §7).
   */
  readonly commonMistakes?: readonly ItemCommonMistake[] | undefined;
  /**
   * MCQ post-attempt reveal: which option was correct, which the learner
   * chose, and the item's explanation. Present only for `mcq_single` items
   * with a stored attempt. The reveal itself IS the learning — an MCQ that
   * scores without showing the explanation teaches nothing.
   */
  readonly mcqReveal?: {
    readonly spec: McqItemSpec;
    readonly selectedOptionId: string;
  };
}

export function FeedbackView({
  evaluation,
  previous,
  topicId,
  commonMistakes,
  mcqReveal,
}: FeedbackViewProps) {
  if (evaluation.unevaluable) {
    return (
      <Card>
        <p>{t.feedback.unevaluable}</p>
      </Card>
    );
  }

  const failedGate = evaluation.deterministic_checks.find(
    (c) => c.is_gate && c.status === 'fail',
  );
  const failedChecks = evaluation.deterministic_checks.filter(
    (c) => c.status === 'fail' && !c.is_gate,
  );
  const good = evaluation.criterion_results.flatMap((c) => c.evidence);
  const missing = evaluation.criterion_results.flatMap((c) =>
    c.missing_elements.map((m) => ({ text: m, criterion: c })),
  );
  const wrong = evaluation.criterion_results.flatMap((c) =>
    c.errors.map((e) => ({ text: e, criterion: c })),
  );

  const confidenceLabel = {
    high: t.feedback.confidenceHigh,
    medium: t.feedback.confidenceMedium,
    low: t.feedback.confidenceLow,
    requires_human_review: t.feedback.confidenceReview,
  }[evaluation.confidence_level];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Card>
        <div className={styles.scoreRow}>
          <span className={styles.scoreValue}>{evaluation.final_score}</span>
          <span className={styles.scoreOutOf}>{t.feedback.outOf}</span>
          <Badge tone="neutral">
            {t.feedback.attemptLabel} {evaluation.attempt_number}
          </Badge>
          <Badge tone={evaluation.confidence_level === 'high' ? 'success' : 'warning'}>
            {t.feedback.confidenceLabel}: {confidenceLabel}
          </Badge>
        </div>
        {failedGate ? <p className={styles.error}>{t.feedback.gateFailed}</p> : null}
        {evaluation.score_cap < 100 ? (
          <p className={styles.capNote}>
            {t.feedback.capNote}: {evaluation.raw_score} ← {evaluation.final_score} (
            {evaluation.cap_source})
          </p>
        ) : null}
      </Card>

      {previous && !failedGate ? (
        <Card>
          <h3>{t.feedback.improvementTitle}</h3>
          <table className={styles.criteriaTable}>
            <thead>
              <tr>
                <th scope="col">{t.feedback.improvementCriterion}</th>
                <th scope="col">{t.feedback.prevLabel}</th>
                <th scope="col">{t.feedback.currentLabel}</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.criterion_results.map((c) => {
                const prev = previous.criterion_results.find(
                  (p) => p.criterion_id === c.criterion_id,
                );
                const delta = prev ? c.awarded_points - prev.awarded_points : 0;
                return (
                  <tr key={c.criterion_id}>
                    <td>{c.criterion_name}</td>
                    <td>{prev ? prev.awarded_points : '—'}</td>
                    <td>
                      {c.awarded_points}{' '}
                      {delta > 0 ? (
                        <span className={styles.improved}>▲ +{Math.round(delta * 100) / 100}</span>
                      ) : delta < 0 ? (
                        <span className={styles.declined}>▼ {Math.round(delta * 100) / 100}</span>
                      ) : (
                        <span className={styles.remediation}>{t.feedback.noChange}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : null}

      {!failedGate ? (
        <Card>
          <h3>{t.feedback.criteriaLabel}</h3>
          <table className={styles.criteriaTable}>
            <thead>
              <tr>
                <th scope="col">{t.feedback.criterionLabel}</th>
                <th scope="col">{t.feedback.levelLabel}</th>
                <th scope="col">{t.feedback.pointsLabel}</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.criterion_results.map((c) => (
                <tr key={c.criterion_id}>
                  <td>
                    {c.criterion_name}
                    {c.performance_level < 4 ? (
                      <>
                        {' · '}
                        <Link
                          className={styles.remediation}
                          href={remediationHref(topicId, c.remediation)}
                        >
                          {t.feedback.reviseLink}
                        </Link>
                      </>
                    ) : null}
                  </td>
                  <td>
                    <LevelBar level={c.performance_level} />
                  </td>
                  <td>
                    {c.awarded_points} / {c.max_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {good.length && !failedGate ? (
        <Card>
          <h3>{t.feedback.whatWasGood}</h3>
          <ul className={`${styles.feedbackList} ${styles.feedbackGood}`}>
            {good.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {missing.length && !failedGate ? (
        <Card>
          <h3>{t.feedback.whatIsMissing}</h3>
          <ul className={`${styles.feedbackList} ${styles.feedbackMissing}`}>
            {missing.map((m, i) => (
              <li key={i}>
                {m.text}{' '}
                <Link
                  className={styles.remediation}
                  href={remediationHref(topicId, m.criterion.remediation)}
                >
                  {t.feedback.reviseLink}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {wrong.length ? (
        <Card>
          <h3>{t.feedback.whatIsWrong}</h3>
          <ul className={`${styles.feedbackList} ${styles.feedbackWrong}`}>
            {wrong.map((w, i) => (
              <li key={i}>
                {w.text}{' '}
                <Link
                  className={styles.remediation}
                  href={remediationHref(topicId, w.criterion.remediation)}
                >
                  {t.feedback.reviseLink}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {mcqReveal ? (
        <Card variant="quiet">
          <h3>{t.mcq.correctAnswerLabel}</h3>
          <ul className={styles.feedbackList}>
            {mcqReveal.spec.options.map((option) => {
              const isCorrect = option.id === mcqReveal.spec.correctOptionId;
              const wasChosen = option.id === mcqReveal.selectedOptionId;
              const marker = isCorrect ? '✓' : wasChosen ? '✗' : '·';
              return (
                <li
                  key={option.id}
                  className={
                    isCorrect
                      ? styles.feedbackGood
                      : wasChosen
                        ? styles.feedbackWrong
                        : undefined
                  }
                >
                  <strong>{marker}</strong> {option.labelHe}
                  {isCorrect && wasChosen ? ` — ${t.mcq.yourAnswerLabel}` : ''}
                  {isCorrect && !wasChosen ? ` — ${t.mcq.correctAnswerLabel}` : ''}
                  {!isCorrect && wasChosen ? ` — ${t.mcq.yourAnswerLabel}` : ''}
                </li>
              );
            })}
          </ul>
          <p>
            <strong>{t.mcq.explanationLabel}:</strong> {mcqReveal.spec.explanationHe}
          </p>
        </Card>
      ) : null}

      {commonMistakes?.length ? (
        <Card variant="quiet">
          <h3>{t.feedback.commonMistakesTitle}</h3>
          <p className={styles.capNote}>{t.feedback.commonMistakesHint}</p>
          <ul className={styles.feedbackList}>
            {commonMistakes.map((mistake) => (
              <li key={mistake.misconceptionId}>
                {mistake.descriptionHe}
                <br />
                <span className={styles.remediation}>
                  {t.content.whyTemptingLabel}: {mistake.whyTempting}
                </span>{' '}
                <Link
                  className={styles.remediation}
                  href={remediationHref(topicId, {
                    ref: mistake.remediationRef,
                    ...(mistake.anchor ? { anchor: mistake.anchor } : {}),
                  })}
                >
                  {t.feedback.reviseLink}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {failedChecks.length ? (
        <Card variant="quiet">
          <h3>{t.feedback.checksLabel}</h3>
          <ul className={styles.feedbackList}>
            {failedChecks.map((c) => (
              <li key={c.check_id}>
                {c.details} ({c.error_code})
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
