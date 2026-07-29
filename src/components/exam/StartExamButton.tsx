'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { startExam } from '@/app/actions';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from '@/components/practice/practice.module.css';

/**
 * Starts a sitting. The plan is frozen server-side before the first item is
 * shown (docs/10 §7.1), so this button is the only moment at which selection
 * happens — nothing is re-planned once the exam is under way.
 */
export function StartExamButton({ blueprintId }: { readonly blueprintId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function start() {
    setError(null);
    startTransition(async () => {
      const result = await startExam(blueprintId);
      if (!result.ok || !result.sessionId) {
        setError(t.sitting.startFailed);
        return;
      }
      router.push(routes.examSession(result.sessionId));
    });
  }

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.submitButton} onClick={start} disabled={pending}>
        {pending ? t.sitting.starting : t.sitting.startExam}
      </button>
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
