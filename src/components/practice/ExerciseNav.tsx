import Link from 'next/link';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from './ExerciseNav.module.css';

interface ExerciseNavProps {
  /** 1-based position of this exercise in the practice queue. */
  readonly position: number;
  readonly total: number;
  readonly previousId: string | null;
  readonly nextId: string | null;
  /** How many exercises in the queue already have at least one attempt. */
  readonly answered: number;
  /** True once this exercise has been answered — makes "next" the main action. */
  readonly isAnswered: boolean;
}

/**
 * Moving through the practice queue, and knowing where you are in it.
 *
 * Both were missing: an exercise page was a dead end once answered, with no
 * way forward except going back to the list, and nothing on the page said how
 * much of the queue was behind you. Plain links rather than a client component
 * — this is navigation, and it should work before hydration.
 */
export function ExerciseNav({
  position,
  total,
  previousId,
  nextId,
  answered,
  isAnswered,
}: ExerciseNavProps) {
  const ratio = total === 0 ? 0 : (answered / total) * 100;
  // A learner who has answered two of 688 has not answered "0%". Rounding to a
  // whole number here reads as a broken counter, so a value that would round
  // to zero while real work exists keeps one decimal instead.
  const percentLabel =
    answered > 0 && ratio < 1 ? ratio.toFixed(1) : String(Math.round(ratio));

  return (
    <nav className={styles.nav} aria-label={t.practice.navLabel}>
      <div className={styles.meter}>
        <div className={styles.meterHead}>
          <span>
            {t.practice.positionLabel} {position} {t.practice.positionOf} {total}
          </span>
          <span className={styles.answered}>
            {t.practice.answeredLabel}: {answered} ({percentLabel}%)
          </span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={t.practice.answeredLabel}
        >
          <div className={styles.fill} style={{ inlineSize: `${ratio}%` }} />
        </div>
      </div>

      <div className={styles.actions}>
        <Link href={routes.practice} className={styles.secondary}>
          {t.practice.backToList}
        </Link>
        {previousId ? (
          <Link href={`${routes.practice}/${previousId}`} className={styles.secondary}>
            {t.practice.previous}
          </Link>
        ) : null}
        {nextId ? (
          <Link
            href={`${routes.practice}/${nextId}`}
            className={isAnswered ? styles.primary : styles.secondary}
          >
            {t.practice.next}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
