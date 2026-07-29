import Link from 'next/link';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from './States.module.css';

interface NotFoundStateProps {
  readonly title?: string;
  readonly body?: string;
}

function NotFoundIcon() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function NotFoundState({ title, body }: NotFoundStateProps) {
  return (
    <div className={styles.state}>
      <NotFoundIcon />
      <p className={styles.title}>{title ?? t.states.notFound.title}</p>
      <p className={styles.body}>{body ?? t.states.notFound.body}</p>
      <div className={styles.actions}>
        <Link
          href={routes.dashboard}
          className={`${styles.button ?? ''} ${styles.buttonQuiet ?? ''}`}
        >
          {t.states.notFound.backToDashboard}
        </Link>
      </div>
    </div>
  );
}
