import type { ReactNode } from 'react';
import { MAIN_CONTENT_ID } from '@/lib/constants';
import { t } from '@/i18n';
import { AppNav } from './AppNav';
import styles from './AppShell.module.css';

export { MAIN_CONTENT_ID };

interface AppShellProps {
  readonly children: ReactNode;
}

/**
 * The global frame: skip link, navigation, and the main landmark.
 *
 * A server component. Only the navigation needs interactivity, and it is the
 * only part that opts into the client bundle.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <a href={`#${MAIN_CONTENT_ID}`} className={styles.skipLink}>
        {t.nav.skipToContent}
      </a>

      <AppNav />

      <main id={MAIN_CONTENT_ID} className={styles.main} tabIndex={-1}>
        <div className={styles.mainInner}>{children}</div>
      </main>
    </div>
  );
}
