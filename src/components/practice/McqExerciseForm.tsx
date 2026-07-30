'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { submitMcqAnswer } from '@/app/actions';
import type { McqItemSpec } from '@/scoring/mcqEngine';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { t } from '@/i18n';
import styles from './practice.module.css';

interface McqExerciseFormProps {
  readonly itemId: string;
  readonly spec: McqItemSpec;
  readonly initialSelectedId?: string | undefined;
  /** Present only inside an exam sitting — no feedback until the exam ends. */
  readonly examSessionId?: string | undefined;
}

/**
 * The MCQ answer surface: pick one option, submit, get scored.
 *
 * The form does not decide correctness — that belongs to the engine on the
 * server, which stores the attempt as ordinary evidence. This component only
 * prevents multiple submits, disables the choices while pending, and forwards
 * the answer. The right feedback view (below the form on the same page)
 * reveals the correct option and the explanation after the attempt lands.
 */
export function McqExerciseForm({ itemId, spec, initialSelectedId, examSessionId }: McqExerciseFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(initialSelectedId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const elapsed = useElapsedSeconds();

  function submit() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await submitMcqAnswer(
        itemId,
        { selectedOptionId: selected },
        elapsed(),
        examSessionId,
      );
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
      <fieldset className={styles.field} disabled={pending}>
        <legend className={styles.label}>{t.mcq.chooseOption}</legend>
        {spec.options.map((option) => (
          <label key={option.id} className={styles.checkboxRow}>
            <input
              type="radio"
              name={`mcq-${itemId}`}
              value={option.id}
              checked={selected === option.id}
              onChange={(e) => setSelected(e.target.value)}
            />
            <span>{option.labelHe}</span>
          </label>
        ))}
      </fieldset>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={pending || !selected}
        >
          {pending ? t.report.submitting : t.report.submit}
        </button>
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
