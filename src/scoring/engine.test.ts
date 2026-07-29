import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DefectReportAnswer } from '@/content/blocks';
import { deriveLevel, evaluate, roundHalfUp, type EvaluateInput } from './engine';
import type { RubricDoc } from './types';

/**
 * Engine tests run against the REAL rubrics and REAL model answers in
 * content/ — the golden records. If an author edits a rubric or a model
 * answer into inconsistency, these tests are what catches it (QM-09).
 */

const CONTENT = join(process.cwd(), 'content');

async function loadRubric(id: string): Promise<RubricDoc> {
  return JSON.parse(await readFile(join(CONTENT, 'rubrics', `${id}.json`), 'utf8'));
}

async function loadExercises() {
  const items = [];
  for (const dir of ['exercises', 'exams']) {
    const files = (await readdir(join(CONTENT, dir))).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      items.push(JSON.parse(await readFile(join(CONTENT, dir, f), 'utf8')));
    }
  }
  return items.filter((i) => i.type === 'exercise' || i.type === 'exam_item');
}

function input(
  answer: DefectReportAnswer,
  rubric: RubricDoc,
  overrides: Partial<EvaluateInput> = {},
): EvaluateInput {
  return {
    answer,
    rubric,
    questionId: 'DOC-defects.EX.001',
    itemVersion: 1,
    questionType: 'author_defect_report',
    attemptId: 'test-attempt',
    attemptNumber: 1,
    userId: 'test',
    submittedAt: '2026-07-29T10:00:00.000Z',
    requiresEvidence: true,
    ...overrides,
  };
}

const EMPTY: DefectReportAnswer = {
  title: '', environment: '', preconditions: '', steps: ['', '', ''],
  actual: '', expected: '', evidence: '', severity: '', severityJustification: '',
};

describe('level derivation (docs/07 §4.3)', () => {
  it('maps coverage to levels at the documented thresholds', () => {
    expect(deriveLevel(0, false, false)).toBe(0);
    expect(deriveLevel(0.29, false, false)).toBe(1);
    expect(deriveLevel(0.3, false, false)).toBe(2);
    expect(deriveLevel(0.54, false, false)).toBe(2);
    expect(deriveLevel(0.55, false, false)).toBe(3);
    expect(deriveLevel(0.84, false, false)).toBe(3);
    expect(deriveLevel(0.85, false, false)).toBe(4);
    expect(deriveLevel(1, false, false)).toBe(4);
  });

  it('caps at level 1 on a critical error regardless of coverage', () => {
    expect(deriveLevel(1, true, false)).toBe(1);
  });

  it('caps at level 3 when a must component is missing', () => {
    expect(deriveLevel(1, false, true)).toBe(3);
  });
});

describe('rounding (docs/07 §5.2)', () => {
  it('rounds half up, once', () => {
    expect(roundHalfUp(62.5)).toBe(63);
    expect(roundHalfUp(43.75)).toBe(44);
    expect(roundHalfUp(60.49)).toBe(60);
  });
});

describe('golden: every model answer scores maxScore (QM-09)', () => {
  it('holds for all authored exercises and exam items', async () => {
    const exercises = await loadExercises();
    expect(exercises.length).toBeGreaterThanOrEqual(8);
    for (const exercise of exercises) {
      const rubric = await loadRubric(exercise.rubricRef);
      const result = evaluate(
        input(exercise.modelAnswer, rubric, {
          questionId: exercise.id,
          questionType: exercise.questionType,
          requiresEvidence: exercise.requiresEvidence,
        }),
      );
      expect(result.final_score, `${exercise.id} model answer`).toBe(100);
      expect(result.unevaluable).toBe(false);
    }
  });
});

describe('determinism (AT-SC-01)', () => {
  it('the same answer produces an identical evaluation every time', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const exercises = await loadExercises();
    const answer = exercises[0].modelAnswer;
    const first = evaluate(input(answer, rubric));
    for (let i = 0; i < 10; i++) {
      const again = evaluate(input(answer, rubric));
      expect(again.final_score).toBe(first.final_score);
      expect(again.criterion_results).toEqual(first.criterion_results);
      expect(again.answer_hash).toBe(first.answer_hash);
    }
  });
});

describe('gates and caps', () => {
  it('an empty answer fails the gate and scores 0 (AT-SC-11)', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const result = evaluate(input(EMPTY, rubric));
    expect(result.final_score).toBe(0);
    expect(result.cap_source).toBe('E-GEN-001');
    expect(result.criterion_results).toHaveLength(0);
    expect(result.confidence_level).toBe('high');
  });

  it('a missing Expected Result caps the score at 60 (AT-SC-21)', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const exercises = await loadExercises();
    const strong = exercises.find((e) => e.id === 'DOC-defects.EX.001').modelAnswer;
    const withoutExpected = { ...strong, expected: '' };
    const result = evaluate(input(withoutExpected, rubric));
    expect(result.raw_score).toBeGreaterThan(60);
    expect(result.score_cap).toBe(60);
    expect(result.cap_source).toBe('E-BUG-003');
    expect(result.final_score).toBe(60);
  });

  it('caps do not stack — the minimum applies (AT-SC-22)', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const exercises = await loadExercises();
    const strong = exercises.find((e) => e.id === 'DOC-defects.EX.001').modelAnswer;
    const gutted = { ...strong, expected: '', actual: '', steps: [''] };
    const result = evaluate(input(gutted, rubric));
    // DC-BUG-01/02/03 all cap at 60; DC-BUG-04 (identifiable) still passes
    // via the long title. The caps must not compound below their minimum.
    expect(result.score_cap).toBe(60);
    expect(result.final_score).toBeLessThanOrEqual(60);
  });

  it('a complete answer outscores a partial one (AT-SC-06/07/08)', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const exercises = await loadExercises();
    const strong = exercises.find((e) => e.id === 'DOC-defects.EX.001').modelAnswer;
    const partial: DefectReportAnswer = {
      ...strong,
      title: 'באג בתשלום',
      severityJustification: '',
      evidence: '',
      steps: ['ללחוץ פעמיים על שלם'],
    };
    const partialResult = evaluate(input(partial, rubric));
    const strongResult = evaluate(input(strong, rubric));
    expect(strongResult.final_score).toBeGreaterThan(partialResult.final_score);
    expect(partialResult.final_score).toBeGreaterThan(0);
  });
});

describe('critical errors', () => {
  it('blame language caps the neutrality criterion at level 1', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const exercises = await loadExercises();
    const strong = exercises.find((e) => e.id === 'DOC-defects.EX.001').modelAnswer;
    const blaming = {
      ...strong,
      actual: `${strong.actual} זה קרה בגלל רשלנות של צוות הפיתוח.`,
    };
    const result = evaluate(input(blaming, rubric));
    const c9 = result.criterion_results.find((c) => c.criterion_id === 'c9');
    expect(c9?.critical_error_triggered).toBe(true);
    expect(c9?.performance_level).toBeLessThanOrEqual(1);
    expect(result.final_score).toBeLessThan(
      evaluate(input(strong, rubric)).final_score,
    );
  });

  it('expected identical to actual is a critical error on c6', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const exercises = await loadExercises();
    const strong = exercises.find((e) => e.id === 'DOC-defects.EX.001').modelAnswer;
    const identical = { ...strong, expected: strong.actual };
    const result = evaluate(input(identical, rubric));
    const c6 = result.criterion_results.find((c) => c.criterion_id === 'c6');
    expect(c6?.critical_error_triggered).toBe(true);
    expect(c6?.performance_level).toBeLessThanOrEqual(1);
  });
});

describe('unevaluable items (AT-SC-31/39)', () => {
  it('a non-active rubric routes to human review, never 0-as-a-grade', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const draft = { ...rubric, status: 'draft' as const };
    const exercises = await loadExercises();
    const result = evaluate(input(exercises[0].modelAnswer, draft));
    expect(result.unevaluable).toBe(true);
    expect(result.human_review_required).toBe(true);
    expect(result.confidence_level).toBe('requires_human_review');
  });

  it('weights not summing to 100 make the item unevaluable', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const broken = {
      ...rubric,
      criteria: rubric.criteria.slice(1),
    };
    const exercises = await loadExercises();
    const result = evaluate(input(exercises[0].modelAnswer, broken));
    expect(result.unevaluable).toBe(true);
  });
});

describe('repair exercise diagnosis', () => {
  it('scores selected flaw options and penalises wrong selections', async () => {
    const rubric = await loadRubric('RUB.BUG_REPAIR');
    const exercises = await loadExercises();
    const repair = exercises.find((e) => e.id === 'DOC-defects.EX.005');
    const model = repair.modelAnswer;

    const full = evaluate(input(model, rubric, { requiresEvidence: false, questionType: 'repair_defect_report' }));
    expect(full.final_score).toBe(100);

    const noDiagnosis = evaluate(
      input({ ...model, diagnosis: [] }, rubric, { requiresEvidence: false, questionType: 'repair_defect_report' }),
    );
    const c1 = noDiagnosis.criterion_results.find((c) => c.criterion_id === 'c1');
    expect(c1?.performance_level).toBe(0);
    expect(noDiagnosis.final_score).toBeLessThan(full.final_score);

    const overSelected = evaluate(
      input(
        { ...model, diagnosis: [...(model.diagnosis ?? []), 'too-many-screenshots', 'severity-too-low'] },
        rubric,
        { requiresEvidence: false, questionType: 'repair_defect_report' },
      ),
    );
    const c1Over = overSelected.criterion_results.find((c) => c.criterion_id === 'c1');
    expect(c1Over?.critical_error_triggered).toBe(true);
  });
});

describe('per-skill scores feed progress (docs/07 §18)', () => {
  it('splits the evaluation into per-skill fractions', async () => {
    const rubric = await loadRubric('RUB.BUG_REPORT');
    const exercises = await loadExercises();
    const result = evaluate(input(exercises[0].modelAnswer, rubric));
    expect(result.per_skill_scores['DOC.BUG']).toBe(1);
    expect(result.per_skill_scores['DOC.ADV']).toBe(1);
    expect(result.skills_measured).toContain('FUND.PSY');
  });
});
