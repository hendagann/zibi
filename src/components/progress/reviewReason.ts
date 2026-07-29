import type { ReviewReason } from '@/progress/types';
import { t } from '@/i18n';

/**
 * A review reason as a Hebrew sentence.
 *
 * The computation reports a language-neutral `code` plus numeric `values`
 * (docs/09 §6); the wording lives here in the i18n layer, so no interface
 * string is baked into `src/progress` (CM-20). Shared by the progress report
 * and the dashboard's review list so the two never drift.
 */
export function reviewReasonText(reason: ReviewReason): string {
  const r = t.progressReport.reviewReasons;
  const v = reason.values;
  switch (reason.code) {
    case 'latest_below_pass':
      return `${r.latestBelowPass} (${v?.latest} < ${v?.threshold})`;
    case 'declining':
      return `${r.declining} (${v?.slope} ${t.progressReport.perAttempt})`;
    case 'unstable':
      return `${r.unstable} (${t.progressReport.stabilityDetail}: ${v?.residual})`;
    case 'recurring_error':
      return `${v?.label} — ${r.recurringError} (${v?.occurrences} ${t.progressReport.occurrencesLabel})`;
    case 'stale':
      return `${r.stale} (${v?.days} ${t.progressReport.days})`;
    case 'repeats_only':
      return r.repeatsOnly;
  }
}
