'use client';

import { t } from '@/i18n';
import styles from './States.module.css';

interface ErrorStateProps {
  readonly title?: string;
  readonly body?: string;
  /** Wired to Next's `reset` in an `error.tsx` boundary. */
  readonly onRetry?: () => void;
  /** Shown inside a collapsed details element. Never shown by default. */
  readonly details?: string;
  readonly inline?: boolean;
}

function ErrorIcon() {
  return (
    <svg
      className={styles.iconError}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

/**
 * The state a surface shows when loading failed.
 *
 * `details` is collapsed by default and is for a developer reading a bug
 * report, not for the learner. Putting a stack trace in front of someone who
 * came to practise test design tells them nothing they can act on.
 */
export function ErrorState({
  title,
  body,
  onRetry,
  details,
  inline,
}: ErrorStateProps) {
  const classes = [styles.state, inline ? styles.inline : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="alert">
      <ErrorIcon />
      <p className={styles.title}>{title ?? t.states.error.title}</p>
      <p className={styles.body}>{body ?? t.states.error.body}</p>

      {onRetry ? (
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={onRetry}>
            {t.states.error.retry}
          </button>
        </div>
      ) : null}

      {details ? (
        <details className={styles.details}>
          <summary className={styles.detailsSummary}>
            {t.states.error.detailsLabel}
          </summary>
          <pre className={styles.detailsBody}>{details}</pre>
        </details>
      ) : null}
    </div>
  );
}
