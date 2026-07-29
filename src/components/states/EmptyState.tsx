import type { ReactNode } from 'react';
import { t } from '@/i18n';
import styles from './States.module.css';

interface EmptyStateProps {
  /** Defaults to the generic empty title from the dictionary. */
  readonly title?: string;
  readonly body?: string;
  readonly action?: ReactNode;
  /** Renders without the tall min-height, for use inside a card. */
  readonly inline?: boolean;
}

function EmptyIcon() {
  return (
    <svg
      className={styles.icon}
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M9 15h6" />
    </svg>
  );
}

/**
 * The state a surface shows when it has loaded successfully and there is
 * genuinely nothing to display.
 *
 * This is the default state of every page in Phase 1, because `content/` is
 * empty. It is not a placeholder for missing UI — it is the correct rendering
 * of an empty library, and it is what the shell shows instead of mock data.
 */
export function EmptyState({ title, body, action, inline }: EmptyStateProps) {
  const classes = [styles.state, inline ? styles.inline : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <EmptyIcon />
      <p className={styles.title}>{title ?? t.states.empty.title}</p>
      <p className={styles.body}>{body ?? t.states.empty.body}</p>
      {action ? <div className={styles.actions}>{action}</div> : null}
    </div>
  );
}
