import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { SkillProgress } from '@/progress/types';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import { DimensionBars } from './DimensionBars';
import { reviewReasonText } from './reviewReason';
import styles from './progress.module.css';

const TREND_LABEL = {
  improving: t.progressReport.trendImproving,
  declining: t.progressReport.trendDeclining,
  steady: t.progressReport.trendSteady,
} as const;

const STABILITY_LABEL = {
  high: t.progressReport.stabilityHigh,
  medium: t.progressReport.stabilityMedium,
  low: t.progressReport.stabilityLow,
} as const;

const CONFIDENCE_LABEL = {
  high: t.progressReport.confidenceHigh,
  medium: t.progressReport.confidenceMedium,
  low: t.progressReport.confidenceLow,
} as const;

interface SkillProgressCardProps {
  readonly skill: SkillProgress;
  readonly titleHe: string;
}

function Signal({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className={styles.signal}>
      <span className={styles.signalLabel}>{label}</span>
      <span className={styles.signalValue}>{value}</span>
      {detail ? <span className={styles.signalDetail}>{detail}</span> : null}
    </div>
  );
}

/**
 * One skill's progress.
 *
 * `ability` leads and the plain mean sits beside it, greyed. Showing both is
 * deliberate: a learner who notices they differ is asking exactly the right
 * question, and hiding the mean would make the headline figure look arbitrary.
 */
export function SkillProgressCard({ skill, titleHe }: SkillProgressCardProps) {
  const minutes =
    skill.medianTimeSeconds === null
      ? null
      : Math.max(1, Math.round(skill.medianTimeSeconds / 60));

  return (
    <Card>
      <div className={styles.skillCard}>
        <div className={styles.skillHead}>
          <span className={styles.skillName}>{titleHe}</span>
          <Badge tone="neutral">
            {t.progressReport.attemptsLabel}: {skill.attempts}
          </Badge>
          <Badge tone={skill.confidence === 'high' ? 'success' : 'warning'}>
            {t.progressReport.confidenceLabel}: {CONFIDENCE_LABEL[skill.confidence]}
          </Badge>
          {skill.needsReview ? (
            <Badge tone="warning">{t.progressReport.needsReviewLabel}</Badge>
          ) : null}
        </div>

        <div className={styles.headline}>
          <div className={styles.abilityBlock}>
            <span className={styles.abilityValue}>{skill.ability}</span>
            <span className={styles.abilityLabel}>{t.progressReport.abilityLabel}</span>
            <span className={styles.abilityHint}>{t.progressReport.abilityHint}</span>
          </div>
          <div className={styles.meanBlock}>
            <span className={styles.meanValue}>{skill.mean}</span>
            <span className={styles.signalLabel}>{t.progressReport.meanLabel}</span>
            <span className={styles.signalDetail}>{t.progressReport.meanHint}</span>
          </div>
        </div>

        <div className={styles.signalGrid}>
          <Signal label={t.progressReport.latestLabel} value={String(skill.latest)} />
          <Signal label={t.progressReport.bestLabel} value={String(skill.best)} />
          <Signal
            label={t.progressReport.trendLabel}
            value={skill.trend ? TREND_LABEL[skill.trend] : t.progressReport.noDimension}
            {...(skill.trendSlope !== null
              ? { detail: `${skill.trendSlope} ${t.progressReport.perAttempt}` }
              : {})}
          />
          <Signal
            label={t.progressReport.stabilityLabel}
            value={
              skill.stabilityLevel
                ? STABILITY_LABEL[skill.stabilityLevel]
                : t.progressReport.noDimension
            }
            {...(skill.stabilityResidual !== null
              ? {
                  detail: `${t.progressReport.stabilityDetail}: ${skill.stabilityResidual}`,
                }
              : {})}
          />
          <Signal
            label={t.progressReport.freshLabel}
            value={
              skill.freshFirstAttemptRate === null
                ? t.progressReport.noDimension
                : `${Math.round(skill.freshFirstAttemptRate * 100)}%`
            }
            detail={`${skill.freshItems} ${t.progressReport.freshHint}`}
          />
          <Signal
            label={t.progressReport.successRateLabel}
            value={`${Math.round(skill.successRate * 100)}%`}
          />
          <Signal
            label={t.progressReport.medianTimeLabel}
            value={
              minutes === null
                ? t.progressReport.noDimension
                : `${minutes} ${t.progressReport.minutesShort}`
            }
          />
          <Signal
            label={t.progressReport.lastPractisedLabel}
            value={skill.lastPractisedAt.slice(0, 10)}
          />
        </div>

        <DimensionBars dimensions={skill.dimensions} />

        {skill.recurringErrors.length > 0 ? (
          <div>
            <p className={styles.signalLabel}>{t.progressReport.recurringErrorsLabel}</p>
            <ul className={styles.errorList}>
              {skill.recurringErrors.map((error) => (
                <li key={error.label}>
                  {error.label} — {error.occurrences} {t.progressReport.occurrencesLabel}
                  {error.remediation && skill.topicId ? (
                    <>
                      {' '}
                      <Link
                        className={styles.errorLink}
                        href={`${routes.topic(skill.topicId)}#${error.remediation.anchor ?? error.remediation.ref}`}
                      >
                        {t.progressReport.reviseHere}
                      </Link>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {skill.needsReview ? (
          <div className={styles.reviewBox}>
            <span className={styles.reviewTitle}>{t.progressReport.needsReviewLabel}</span>
            <ul className={styles.reviewList}>
              {skill.reviewReasons.map((reason) => (
                <li key={reason.code}>{reviewReasonText(reason)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
