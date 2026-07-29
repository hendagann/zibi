import type { DimensionScores } from '@/progress/types';
import { t } from '@/i18n';
import styles from './progress.module.css';

const ROWS = [
  { key: 'knowledge', label: t.dimensions.knowledge, hint: t.dimensions.knowledgeHint },
  { key: 'application', label: t.dimensions.application, hint: t.dimensions.applicationHint },
  { key: 'reasoning', label: t.dimensions.reasoning, hint: t.dimensions.reasoningHint },
  { key: 'speed', label: t.dimensions.speed, hint: t.dimensions.speedHint },
  { key: 'stability', label: t.dimensions.stability, hint: t.dimensions.stabilityHint },
] as const;

/**
 * The five dimensions — docs/09 §2.
 *
 * A dimension with no evidence shows "no measurement yet", never a zero bar.
 * An empty bar and a zero score look identical and mean opposite things.
 */
export function DimensionBars({ dimensions }: { dimensions: DimensionScores }) {
  return (
    <ul className={styles.dimList} role="list">
      {ROWS.map((row) => {
        const value = dimensions[row.key];
        return (
          <li key={row.key} className={styles.dimRow}>
            <span className={styles.dimLabel}>
              {row.label}
              <span className={styles.dimHint}>{row.hint}</span>
            </span>
            {value === null ? (
              <span className={styles.dimEmpty}>{t.dimensions.noEvidence}</span>
            ) : (
              <>
                <span className={styles.dimTrack}>
                  <span
                    className={styles.dimFill}
                    style={{ inlineSize: `${value}%` }}
                    role="meter"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={row.label}
                  />
                </span>
                <span className={styles.dimValue}>{value}</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
