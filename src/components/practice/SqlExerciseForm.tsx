'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { runSqlQuery, submitSqlAnswer, type SqlRunView } from '@/app/actions';
import { t } from '@/i18n';
import styles from './practice.module.css';
import sqlStyles from './SqlExerciseForm.module.css';

interface SqlExerciseFormProps {
  readonly itemId: string;
  /** Prefill — the learner's last submitted query, for revision. */
  readonly initialSql?: string | undefined;
}

/**
 * The SQL answer surface: write → run → see the result → submit.
 *
 * Running executes on the visible dataset only and stores nothing — the
 * learner can iterate freely. Submission evaluates for real (visible plus
 * hidden fixtures, server side) and appends the attempt.
 */
export function SqlExerciseForm({ itemId, initialSql }: SqlExerciseFormProps) {
  const router = useRouter();
  const [sql, setSql] = useState(initialSql ?? '');
  const [runResult, setRunResult] = useState<SqlRunView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await runSqlQuery(itemId, sql);
      setRunResult(result);
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitSqlAnswer(itemId, sql);
      if (!result.ok) {
        setError(t.report.submitError);
        return;
      }
      setRunResult(null);
      router.refresh();
    });
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sql-input">
          {t.sqlModule.queryLabel}
        </label>
        <textarea
          id="sql-input"
          className={sqlStyles.sqlInput}
          dir="ltr"
          spellCheck={false}
          placeholder={t.sqlModule.queryPlaceholder}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
        />
        <p className={sqlStyles.hint}>{t.sqlModule.runFirstHint}</p>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={sqlStyles.runButton}
          onClick={run}
          disabled={pending || !sql.trim()}
        >
          {pending ? t.sqlModule.running : t.sqlModule.run}
        </button>
        <button
          type="button"
          className={styles.submitButton}
          onClick={submit}
          disabled={pending || !sql.trim()}
        >
          {t.sqlModule.submitForGrade}
        </button>
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
      <p className={sqlStyles.hint}>{t.sqlModule.hiddenNote}</p>

      {runResult ? (
        <div className={sqlStyles.resultArea} aria-live="polite">
          <h4 className={sqlStyles.resultTitle}>{t.sqlModule.resultLabel}</h4>
          {!runResult.ok ? (
            <p className={styles.error}>{runResult.errorHe}</p>
          ) : runResult.rows.length === 0 ? (
            <p>{t.sqlModule.emptyResult}</p>
          ) : (
            <>
              <div className={sqlStyles.tableWrap}>
                <table className={sqlStyles.resultTable} dir="ltr">
                  <thead>
                    <tr>
                      {runResult.columns.map((column, i) => (
                        <th key={i} scope="col">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runResult.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci}>{cell === null ? 'NULL' : String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={sqlStyles.hint}>
                {runResult.rows.length} {t.sqlModule.rowsCount}
                {runResult.truncated ? ` · ${t.sqlModule.truncatedNote}` : ''}
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
