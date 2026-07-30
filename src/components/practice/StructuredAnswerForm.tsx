'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { EssaySpec, StructuredAnswer } from '@/content/blocks';
import { emptyStructuredAnswer } from '@/content/blocks';
import { submitAnswer, submitExamAnswer } from '@/app/actions';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { t } from '@/i18n';
import styles from './practice.module.css';

interface StructuredAnswerFormProps {
  readonly itemId: string;
  /** The fields this item asks for, declared on the item (docs/06 §6). */
  readonly spec: EssaySpec;
  /** Prefill — the learner's latest stored answer, for revision. */
  readonly initialAnswer?: StructuredAnswer | undefined;
  /**
   * Present only inside an exam sitting. The submission then goes through the
   * exam action, whose result carries no evaluation — no feedback is released
   * until the exam ends (docs/10 §7).
   */
  readonly examSessionId?: string | undefined;
}

/**
 * The structured-artifact form shared by the open question families —
 * requirement analysis, failure investigation, prioritisation and
 * professional decision.
 *
 * One component rather than four, because the families differ only in *which*
 * fields they ask for, and that is content: each item declares its fields in
 * `essaySpec` and this renders them. The alternative — a component per family
 * — would put the labels and the field lists in `src/`, which is exactly what
 * the content/UI boundary forbids (docs/05 §2, enforced by CM-20).
 *
 * The answer is a flat map of field id → text so the scoring engine reads it
 * with the same field access it uses for a defect report, which is what lets
 * all these families share one deterministic detection layer.
 */
export function StructuredAnswerForm({
  itemId,
  spec,
  initialAnswer,
  examSessionId,
}: StructuredAnswerFormProps) {
  const router = useRouter();
  const [answer, setAnswer] = useState<StructuredAnswer>(
    initialAnswer ?? emptyStructuredAnswer(spec),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const elapsed = useElapsedSeconds();

  function set(fieldId: string, value: string) {
    setAnswer((a) => ({ ...a, [fieldId]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = examSessionId
        ? await submitExamAnswer(examSessionId, itemId, answer, elapsed())
        : await submitAnswer(itemId, answer, elapsed());
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
      {spec.fields.map((field) => (
        <div key={field.id} className={styles.field}>
          <label className={styles.label} htmlFor={`sf-${field.id}`}>
            {field.labelHe}
          </label>
          {field.hintHe ? <p className={styles.hint}>{field.hintHe}</p> : null}
          <textarea
            id={`sf-${field.id}`}
            className={styles.textarea}
            rows={field.rows ?? 4}
            value={answer[field.id] ?? ''}
            onChange={(e) => set(field.id, e.target.value)}
          />
        </div>
      ))}

      {error ? <p role="alert">{error}</p> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={pending}>
          {t.report.submit}
        </button>
      </div>
    </form>
  );
}
