'use client';

import { useState, useTransition } from 'react';
import { runSandboxQuery, type SqlRunView } from '@/app/actions';
import { SchemaView } from './SchemaView';
import { t } from '@/i18n';
import styles from './practice.module.css';
import sqlStyles from './SqlExerciseForm.module.css';

/** The shape the page hands down: enough to render the picker and the schema. */
export interface SandboxDataset {
  readonly id: string;
  readonly titleHe: string;
  readonly descriptionHe: string;
  readonly schema: React.ComponentProps<typeof SchemaView>['dataset']['schema'];
  readonly rows: React.ComponentProps<typeof SchemaView>['dataset']['rows'];
}

interface SqlSandboxProps {
  readonly datasets: readonly SandboxDataset[];
}

/**
 * Free-form SQL against any dataset in the library.
 *
 * Deliberately not an exercise: no rubric, no attempt record, no score. Its
 * job is repetition — writing a query from a blank box, which is what an
 * interview actually asks for and what a pre-filled exercise form cannot
 * rehearse.
 */
export function SqlSandbox({ datasets }: SqlSandboxProps) {
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? '');
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<SqlRunView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dataset = datasets.find((d) => d.id === datasetId);

  /**
   * The catch is the whole point.
   *
   * A server action can reject for reasons that have nothing to do with the
   * query — most often because the server restarted and the page still holds
   * action ids from the previous build. Without a catch the rejection escapes,
   * `setResult` never runs, and the button stays on "running" for ever: the
   * learner sees a hang and has no way to know a reload would fix it.
   */
  function run() {
    setError(null);
    startTransition(async () => {
      try {
        setResult(await runSandboxQuery(datasetId, sql));
      } catch {
        setResult(null);
        setError(t.sqlModule.runFailed);
      }
    });
  }

  if (datasets.length === 0) {
    return <p>{t.sandbox.noDatasets}</p>;
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sandbox-dataset">
          {t.sandbox.datasetLabel}
        </label>
        <select
          id="sandbox-dataset"
          className={sqlStyles.datasetSelect}
          value={datasetId}
          onChange={(e) => {
            setDatasetId(e.target.value);
            // The previous result belongs to the previous database. Keeping it
            // on screen under a new schema would read as this dataset's answer.
            setResult(null);
          }}
        >
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.titleHe}
            </option>
          ))}
        </select>
        {dataset ? <p className={sqlStyles.hint}>{dataset.descriptionHe}</p> : null}
      </div>

      {dataset ? <SchemaView dataset={dataset} /> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="sandbox-sql">
          {t.sandbox.queryLabel}
        </label>
        <textarea
          id="sandbox-sql"
          className={sqlStyles.sqlInput}
          dir="ltr"
          spellCheck={false}
          placeholder={t.sqlModule.queryPlaceholder}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
        />
        <p className={sqlStyles.hint}>{t.sandbox.safetyNote}</p>
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
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className={sqlStyles.resultArea} aria-live="polite">
          <h4 className={sqlStyles.resultTitle}>{t.sqlModule.resultLabel}</h4>
          {!result.ok ? (
            <p className={styles.error}>{result.errorHe}</p>
          ) : result.rows.length === 0 ? (
            <p>{t.sqlModule.emptyResult}</p>
          ) : (
            <>
              <div className={sqlStyles.tableWrap}>
                <table className={sqlStyles.resultTable} dir="ltr">
                  <thead>
                    <tr>
                      {result.columns.map((column, i) => (
                        <th key={i} scope="col">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, ri) => (
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
                {result.rows.length} {t.sqlModule.rowsCount}
                {result.truncated ? ` · ${t.sqlModule.truncatedNote}` : ''}
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
