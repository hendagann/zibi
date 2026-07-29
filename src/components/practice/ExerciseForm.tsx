'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { DefectReportAnswer } from '@/content/blocks';
import { emptyDefectReport } from '@/content/blocks';
import { submitAnswer } from '@/app/actions';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { t } from '@/i18n';
import styles from './practice.module.css';

interface DiagnosisOption {
  readonly id: string;
  readonly label: string;
}

interface ExerciseFormProps {
  readonly itemId: string;
  /** Prefill — the learner's latest stored answer, for revision. */
  readonly initialAnswer?: DefectReportAnswer | undefined;
  readonly diagnosisOptions?: readonly DiagnosisOption[] | undefined;
}

/**
 * The structured defect-report form.
 *
 * The answer shape is structured rather than free text because that is what
 * makes every layer of scoring deterministic (docs/06: the type produces "a
 * structured defect report"). Submission goes through a server action; the
 * evaluation happens and is persisted server-side, and this component only
 * refreshes the page so the stored result renders. Refreshing mid-work keeps
 * the last *submitted* answer — submission is what stores.
 */
export function ExerciseForm({ itemId, initialAnswer, diagnosisOptions }: ExerciseFormProps) {
  const router = useRouter();
  const [answer, setAnswer] = useState<DefectReportAnswer>(
    initialAnswer ?? emptyDefectReport(),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const elapsed = useElapsedSeconds();

  function set<K extends keyof DefectReportAnswer>(key: K, value: DefectReportAnswer[K]) {
    setAnswer((a) => ({ ...a, [key]: value }));
  }

  function setStep(index: number, value: string) {
    setAnswer((a) => ({
      ...a,
      steps: a.steps.map((s, i) => (i === index ? value : s)),
    }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitAnswer(itemId, answer, elapsed());
      if (!result.ok) {
        setError(t.report.submitError);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {diagnosisOptions?.length ? (
        <fieldset className={styles.field}>
          <legend className={styles.label}>{t.report.diagnosisLabel}</legend>
          {diagnosisOptions.map((option) => (
            <label key={option.id} className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={(answer.diagnosis ?? []).includes(option.id)}
                onChange={(e) => {
                  const current = new Set(answer.diagnosis ?? []);
                  if (e.target.checked) current.add(option.id);
                  else current.delete(option.id);
                  set('diagnosis', [...current]);
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="f-title">{t.report.title}</label>
        <input
          id="f-title"
          className={styles.input}
          value={answer.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="f-env">{t.report.environment}</label>
        <input
          id="f-env"
          className={styles.input}
          value={answer.environment}
          onChange={(e) => set('environment', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="f-pre">{t.report.preconditions}</label>
        <input
          id="f-pre"
          className={styles.input}
          value={answer.preconditions}
          onChange={(e) => set('preconditions', e.target.value)}
        />
      </div>

      <fieldset className={styles.field}>
        <legend className={styles.label}>{t.report.steps}</legend>
        {answer.steps.map((step, i) => (
          <div key={i} className={styles.stepsRow}>
            <span className={styles.stepIndex}>{i + 1}.</span>
            <input
              className={styles.input}
              aria-label={`${t.report.stepPlaceholder} ${i + 1}`}
              value={step}
              onChange={(e) => setStep(i, e.target.value)}
            />
            {answer.steps.length > 1 ? (
              <button
                type="button"
                className={styles.smallButton}
                onClick={() =>
                  set('steps', answer.steps.filter((_, idx) => idx !== i))
                }
              >
                {t.report.removeStep}
              </button>
            ) : null}
          </div>
        ))}
        <div>
          <button
            type="button"
            className={styles.smallButton}
            onClick={() => set('steps', [...answer.steps, ''])}
          >
            {t.report.addStep}
          </button>
        </div>
      </fieldset>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="f-actual">{t.report.actual}</label>
        <textarea
          id="f-actual"
          className={styles.textarea}
          value={answer.actual}
          onChange={(e) => set('actual', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="f-expected">{t.report.expected}</label>
        <textarea
          id="f-expected"
          className={styles.textarea}
          value={answer.expected}
          onChange={(e) => set('expected', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="f-evidence">{t.report.evidence}</label>
        <input
          id="f-evidence"
          className={styles.input}
          value={answer.evidence}
          onChange={(e) => set('evidence', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="f-severity">{t.report.severity}</label>
        <select
          id="f-severity"
          className={styles.select}
          value={answer.severity}
          onChange={(e) => set('severity', e.target.value as DefectReportAnswer['severity'])}
        >
          <option value="">{t.report.severityNone}</option>
          <option value="low">{t.report.severityLow}</option>
          <option value="medium">{t.report.severityMedium}</option>
          <option value="high">{t.report.severityHigh}</option>
          <option value="critical">{t.report.severityCritical}</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="f-sevj">{t.report.severityJustification}</label>
        <textarea
          id="f-sevj"
          className={styles.textarea}
          value={answer.severityJustification}
          onChange={(e) => set('severityJustification', e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={pending}>
          {pending ? t.report.submitting : t.report.submit}
        </button>
        {error ? <span className={styles.error} role="alert">{error}</span> : null}
      </div>
    </form>
  );
}
