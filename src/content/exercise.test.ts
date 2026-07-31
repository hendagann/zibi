import { describe, expect, it } from 'vitest';
import {
  answerSurfaceFor,
  isStructuredFamily,
  STRUCTURED_FAMILIES,
  type ExerciseItem,
} from './exercise';

type Surfaceable = Pick<ExerciseItem, 'questionType' | 'mcqSpec' | 'sqlSpec' | 'essaySpec'>;

const mcqSpec = {
  options: [{ id: 'a', labelHe: 'x' }],
  correctOptionId: 'a',
  explanationHe: 'x',
  skillId: 'TECH.SQL',
  dimension: 'knowledge',
} as unknown as NonNullable<ExerciseItem['mcqSpec']>;

const essaySpec = {
  fields: [{ id: 'why', labelHe: 'x', hintHe: 'x', rows: 3 }],
} as unknown as NonNullable<ExerciseItem['essaySpec']>;

/**
 * Every question type the union admits, listed by hand.
 *
 * Deliberately not derived from the union: the point is that a NEW family
 * forces someone to come here and say which form answers it. That is exactly
 * the step that was skipped for `mcq_single` on the exam page, where the
 * missing branch silently fell through to the defect-report form and scored
 * seventy exam questions zero.
 */
const EVERY_TYPE: readonly ExerciseItem['questionType'][] = [
  'author_defect_report',
  'repair_defect_report',
  'sql_query',
  'mcq_single',
  'analyse_requirement',
  'investigate_failure',
  'prioritise_defects',
  'professional_decision',
  'author_test_case',
];

function itemFor(questionType: ExerciseItem['questionType']): Surfaceable {
  // Built by branch rather than by conditional spread: under
  // exactOptionalPropertyTypes a spread widens the field to `T | undefined`,
  // which is not the same type as "absent".
  if (questionType === 'mcq_single') return { questionType, mcqSpec };
  if (isStructuredFamily(questionType)) return { questionType, essaySpec };
  return { questionType };
}

describe('answerSurfaceFor', () => {
  it('gives multiple-choice items the multiple-choice form', () => {
    // The regression: this returned the defect-report form, so an MCQ exam
    // segment rendered a title/steps/actual/expected form and could not be
    // answered at all.
    expect(answerSurfaceFor(itemFor('mcq_single'))).toBe('mcq');
  });

  it('gives SQL items the query form', () => {
    expect(answerSurfaceFor(itemFor('sql_query'))).toBe('sql');
  });

  it('gives every open family the structured form', () => {
    for (const family of STRUCTURED_FAMILIES) {
      expect(answerSurfaceFor(itemFor(family)), family).toBe('structured');
    }
  });

  it('gives the report families the defect-report form', () => {
    expect(answerSurfaceFor(itemFor('author_defect_report'))).toBe('defect_report');
    expect(answerSurfaceFor(itemFor('repair_defect_report'))).toBe('defect_report');
  });

  it('resolves a surface for every question type in the union', () => {
    for (const questionType of EVERY_TYPE) {
      const surface = answerSurfaceFor(itemFor(questionType));
      expect(['mcq', 'sql', 'structured', 'defect_report'], questionType).toContain(surface);
    }
  });

  it('falls back rather than claiming a form the item cannot fill', () => {
    // A structured family with no essaySpec, or an MCQ with no mcqSpec, is a
    // content defect. Rendering a text form is recoverable; rendering a
    // choice list with no choices is not.
    expect(answerSurfaceFor({ questionType: 'mcq_single' })).toBe('defect_report');
    expect(answerSurfaceFor({ questionType: 'investigate_failure' })).toBe('defect_report');
  });
});
