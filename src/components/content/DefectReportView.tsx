import type { DefectReportAnswer } from '@/content/blocks';
import { t } from '@/i18n';
import styles from './BlockRenderer.module.css';

const SEVERITY_LABEL: Record<string, string> = {
  low: t.report.severityLow,
  medium: t.report.severityMedium,
  high: t.report.severityHigh,
  critical: t.report.severityCritical,
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.reportRow}>
      <div className={styles.reportLabel}>{label}</div>
      <div className={styles.reportValue}>{children}</div>
    </div>
  );
}

function Value({ text }: { text: string }) {
  return text.trim() ? <>{text}</> : <span className={styles.reportEmpty}>—</span>;
}

/**
 * Renders a defect report — the same component for a model answer inside a
 * guided example and for the learner's own submission, so the two are
 * visually comparable (docs/05 §15 reason 3).
 */
export function DefectReportView({ report }: { report: DefectReportAnswer }) {
  const steps = report.steps.filter((s) => s.trim());
  return (
    <div className={styles.report}>
      <Row label={t.report.title}><Value text={report.title} /></Row>
      <Row label={t.report.environment}><Value text={report.environment} /></Row>
      <Row label={t.report.preconditions}><Value text={report.preconditions} /></Row>
      <Row label={t.report.steps}>
        {steps.length ? (
          <ol>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        ) : (
          <span className={styles.reportEmpty}>—</span>
        )}
      </Row>
      <Row label={t.report.actual}><Value text={report.actual} /></Row>
      <Row label={t.report.expected}><Value text={report.expected} /></Row>
      <Row label={t.report.evidence}><Value text={report.evidence} /></Row>
      <Row label={t.report.severity}>
        {report.severity ? (
          <>
            {SEVERITY_LABEL[report.severity] ?? report.severity}
            {report.severityJustification.trim() ? ` — ${report.severityJustification}` : ''}
          </>
        ) : (
          <span className={styles.reportEmpty}>—</span>
        )}
      </Row>
    </div>
  );
}
