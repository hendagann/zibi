import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateMcq, type EvaluateMcqInput, type McqItemSpec } from './mcqEngine';

const CONTENT = join(process.cwd(), 'content');

function baseInput(
  spec: McqItemSpec,
  selectedOptionId: string,
  overrides: Partial<EvaluateMcqInput> = {},
): EvaluateMcqInput {
  return {
    answer: { selectedOptionId },
    spec,
    questionId: 'TEST.EX.001',
    itemVersion: 1,
    attemptId: 'a-1',
    attemptNumber: 1,
    userId: 'local',
    submittedAt: '2026-07-30T10:00:00.000Z',
    ...overrides,
  };
}

const SAMPLE: McqItemSpec = {
  options: [
    { id: 'a', labelHe: 'לא נכון' },
    { id: 'b', labelHe: 'נכון' },
    { id: 'c', labelHe: 'לא נכון אחר' },
  ],
  correctOptionId: 'b',
  explanationHe: 'הסבר',
  skillId: 'DOC.BUG',
  dimension: 'knowledge',
};

describe('MCQ scoring — the deterministic single-answer path', () => {
  it('the correct option scores 100 and attributes to the item skill', () => {
    const r = evaluateMcq(baseInput(SAMPLE, 'b'));
    expect(r.final_score).toBe(100);
    expect(r.per_skill_scores).toEqual({ 'DOC.BUG': 1 });
    expect(r.criterion_results[0]!.performance_level).toBe(4);
    expect(r.unevaluable).toBe(false);
  });

  it('a wrong option scores 0 and lists what was chosen vs. what was needed', () => {
    const r = evaluateMcq(baseInput(SAMPLE, 'a'));
    expect(r.final_score).toBe(0);
    expect(r.per_skill_scores).toEqual({ 'DOC.BUG': 0 });
    expect(r.criterion_results[0]!.errors).toContain('נבחר: a');
    expect(r.criterion_results[0]!.missing_elements).toContain('נדרש: b');
  });

  it('an empty selection trips the gate and scores 0 without accusing a wrong choice', () => {
    const r = evaluateMcq(baseInput(SAMPLE, ''));
    expect(r.final_score).toBe(0);
    expect(r.deterministic_checks.find((c) => c.check_id === 'DC-GEN-01')?.status).toBe('fail');
    // Nothing was chosen, so the "you chose X" line must not exist.
    expect(r.criterion_results[0]!.errors).toEqual([]);
  });

  it('a selection that is not one of the item options trips the option-set gate', () => {
    const r = evaluateMcq(baseInput(SAMPLE, 'zz'));
    expect(r.final_score).toBe(0);
    expect(r.deterministic_checks.find((c) => c.check_id === 'DC-GEN-05')?.status).toBe('fail');
  });

  it('the criterion carries the item dimension, not a rubric fixed one', () => {
    // The synthetic rubric ships dimension='application' as a placeholder; the
    // evaluator must override with what the item declares.
    const application = evaluateMcq(baseInput(SAMPLE, 'b')).criterion_results[0]!.dimension;
    expect(application).toBe('knowledge');
    const reasoning = evaluateMcq(
      baseInput({ ...SAMPLE, dimension: 'reasoning' }, 'b'),
    ).criterion_results[0]!.dimension;
    expect(reasoning).toBe('reasoning');
  });

  it('produces an identical evaluation on every run (AT-SC-01)', () => {
    const first = evaluateMcq(baseInput(SAMPLE, 'b'));
    for (let i = 0; i < 5; i += 1) {
      expect(evaluateMcq(baseInput(SAMPLE, 'b'))).toEqual(first);
    }
  });
});

describe('golden: every authored MCQ item scores 100 on its own correctOptionId', () => {
  it('holds for every mcq_single item in content/', async () => {
    const files = (await readdir(join(CONTENT, 'exercises'))).filter((f) => f.endsWith('.json'));
    const mcqItems: { id: string; mcqSpec: McqItemSpec; version: number }[] = [];
    for (const f of files) {
      const item = JSON.parse(await readFile(join(CONTENT, 'exercises', f), 'utf8'));
      if (item.questionType === 'mcq_single' && item.mcqSpec) {
        mcqItems.push({ id: item.id, mcqSpec: item.mcqSpec, version: item.version });
      }
    }
    expect(mcqItems.length).toBeGreaterThanOrEqual(1);
    for (const item of mcqItems) {
      const r = evaluateMcq(
        baseInput(item.mcqSpec, item.mcqSpec.correctOptionId, {
          questionId: item.id,
          itemVersion: item.version,
        }),
      );
      expect(r.final_score, `${item.id} model answer`).toBe(100);
    }
  });
});
