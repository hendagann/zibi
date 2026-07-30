import { createHash } from 'node:crypto';
import type {
  CriterionResult,
  DeterministicCheckResult,
  EvaluationResult,
} from './types';
import { EVALUATION_VERSION } from './types';
import { t } from '@/i18n';

/**
 * MCQ scoring — the deterministic single-answer path.
 *
 * A separate engine, not a branch inside the defect-report evaluator, because
 * the two share nothing: an MCQ has no answer components to detect, no rubric
 * criteria to weight, and no evidence to quote. It is a set equality check,
 * scored 100 or 0 with no partial credit — which is docs/07's `mcq_single`
 * partial-credit policy (`none`).
 *
 * The rubric it produces on the wire is synthetic. It carries one criterion so
 * that the progress model (docs/09) can attribute the score to a skill and a
 * dimension the same way it does for authored items — otherwise MCQ evidence
 * would be invisible to the ability computation.
 */

export interface McqOption {
  readonly id: string;
  readonly labelHe: string;
}

export interface McqItemSpec {
  readonly options: readonly McqOption[];
  readonly correctOptionId: string;
  /** Shown after submission — the "learn from the answer" part. */
  readonly explanationHe: string;
  readonly skillId: string;
  /** Which of the five progress dimensions this item measures. */
  readonly dimension: 'knowledge' | 'application' | 'reasoning';
}

export interface McqAnswer {
  readonly selectedOptionId: string;
}

export interface EvaluateMcqInput {
  readonly answer: McqAnswer;
  readonly spec: McqItemSpec;
  readonly questionId: string;
  readonly itemVersion: number;
  readonly attemptId: string;
  readonly attemptNumber: number;
  readonly userId: string;
  readonly submittedAt: string;
  readonly timeSpentSeconds?: number | null;
}

/** The synthetic rubric id and version pinned into every MCQ evaluation. */
export const MCQ_RUBRIC_ID = 'RUB.MCQ_SINGLE';
export const MCQ_RUBRIC_VERSION = 1;

export function evaluateMcq(input: EvaluateMcqInput): EvaluationResult {
  const { answer, spec } = input;

  const answered = answer.selectedOptionId.trim().length > 0;
  const isValidSelection = spec.options.some((o) => o.id === answer.selectedOptionId);
  const correct = answered && isValidSelection && answer.selectedOptionId === spec.correctOptionId;

  const checks: DeterministicCheckResult[] = [
    {
      check_id: 'DC-GEN-01',
      status: answered ? 'pass' : 'fail',
      is_gate: true,
      score_effect: 0,
      score_cap: answered ? 100 : 0,
      error_code: 'E-GEN-001',
      details: t.checks.notEmpty,
    },
    {
      check_id: 'DC-GEN-05',
      status: isValidSelection ? 'pass' : answered ? 'fail' : 'not_applicable',
      is_gate: true,
      score_effect: 0,
      score_cap: !answered || isValidSelection ? 100 : 0,
      error_code: 'E-GEN-005',
      details: t.checks.notEmpty,
    },
  ];

  const finalScore = correct ? 100 : 0;
  /* Synthetic criterion. Its remediation.ref is the item itself so the
   * feedback view has somewhere to link — the real remediation, if any, is
   * offered by the item's `commonMistakes`, not by the criterion. */
  const criterion: CriterionResult = {
    criterion_id: 'c1',
    criterion_name: t.mcq.criterionName,
    dimension: spec.dimension,
    skill_ids: [spec.skillId],
    weight: 100,
    performance_level: correct ? 4 : 0,
    level_percentage: correct ? 100 : 0,
    coverage: correct ? 1 : 0,
    awarded_points: finalScore,
    max_points: 100,
    detected_components: correct ? ['c1.selected_correct'] : [],
    evidence: correct ? [`${answer.selectedOptionId} ✓`] : [],
    missing_elements: correct ? [] : [t.mcq.missingCorrect(spec.correctOptionId)],
    errors: correct
      ? []
      : answered
        ? [t.mcq.wrongChoice(answer.selectedOptionId)]
        : [],
    critical_error_triggered: false,
    remediation: { ref: input.questionId },
  };

  return {
    evaluation_id: `ev-${input.attemptId}`,
    question_id: input.questionId,
    item_version: input.itemVersion,
    attempt_id: input.attemptId,
    attempt_number: input.attemptNumber,
    user_id: input.userId,
    question_type: 'mcq_single',
    rubric_id: MCQ_RUBRIC_ID,
    rubric_version: MCQ_RUBRIC_VERSION,
    evaluation_version: EVALUATION_VERSION,
    submitted_at: input.submittedAt,
    evaluated_at: input.submittedAt,
    answer_hash: createHash('sha256')
      .update(JSON.stringify(answer))
      .digest('hex')
      .slice(0, 16),
    time_spent_seconds: input.timeSpentSeconds ?? null,
    deterministic_checks: checks,
    criterion_results: [criterion],
    raw_score: finalScore,
    penalties: [],
    score_cap: 100,
    cap_source: null,
    final_score: finalScore,
    confidence_level: 'high',
    confidence_reasons: [],
    human_review_required: false,
    unevaluable: false,
    skills_measured: [spec.skillId],
    per_skill_scores: { [spec.skillId]: finalScore / 100 },
  };
}
