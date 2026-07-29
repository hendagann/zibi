import { SkeletonStack } from '@/components/ui/Skeleton';
import { t } from '@/i18n';
import styles from './States.module.css';

interface LoadingStateProps {
  /** Number of placeholder lines to show beneath the spinner. */
  readonly lines?: number;
  /** Hide the skeleton and show only the spinner row. */
  readonly compact?: boolean;
  readonly label?: string;
}

/**
 * The state a surface shows while its data is in flight.
 *
 * One accessible announcement, one visual placeholder. The skeleton is
 * `aria-hidden`; the live region carries the message, so assistive technology
 * hears "loading" once rather than reading a wall of empty boxes.
 */
export function LoadingState({ lines = 3, compact, label }: LoadingStateProps) {
  return (
    <div className={styles.loading}>
      <div className={styles.spinnerRow} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <span>{label ?? t.states.loading.announce}</span>
      </div>
      {compact ? null : <SkeletonStack lines={lines} />}
    </div>
  );
}
