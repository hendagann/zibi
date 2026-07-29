import type { SqlDataset } from '@/sql/executor';
import { t } from '@/i18n';
import styles from './SqlExerciseForm.module.css';

interface SchemaViewProps {
  readonly dataset: SqlDataset & { titleHe?: string };
  /** Sample rows shown per table. */
  readonly sampleRows?: number;
}

/**
 * The visible schema and sample data of an exercise dataset — the learner
 * writes queries against what she can actually see (מבנה הטבלאות + נתונים
 * לדוגמה in the exercise structure). Hidden fixtures are never rendered.
 */
export function SchemaView({ dataset, sampleRows = 5 }: SchemaViewProps) {
  return (
    <div className={styles.schemaGrid}>
      {dataset.schema.tables.map((table) => {
        return (
          <div key={table.name} className={styles.schemaTable}>
            <div className={styles.schemaName}>
              <span>{(table as { he?: string }).he ?? table.name}</span>
              <span className={styles.schemaNameEn}>{table.name}</span>
            </div>
            <table className={styles.schemaCols}>
              <tbody>
                {table.columns.map((column) => (
                  <tr key={column.name}>
                    <td className={styles.colName}>{column.name}</td>
                    <td className={styles.colType}>{column.type}</td>
                    <td>{column.he}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <div className={styles.schemaTable} style={{ gridColumn: '1 / -1' }}>
        <div className={styles.schemaName}>{t.sqlModule.sampleDataLabel}</div>
        {dataset.schema.tables.map((table) => {
          const rows = (dataset.rows[table.name] ?? []).slice(0, sampleRows);
          const total = (dataset.rows[table.name] ?? []).length;
          return (
            <div key={table.name} style={{ padding: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {table.name} — {total} {t.sqlModule.rowsCount}
              </p>
              <div className={styles.tableWrap}>
                <table className={styles.resultTable} dir="ltr">
                  <thead>
                    <tr>
                      {table.columns.map((c) => (
                        <th key={c.name} scope="col">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri}>
                        {table.columns.map((c) => (
                          <td key={c.name}>
                            {row[c.name] === null ? 'NULL' : String(row[c.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > sampleRows ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)' }}>
                  +{total - sampleRows} {t.sqlModule.moreRows}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
