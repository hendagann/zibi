/**
 * Scoring types — the schemas of docs/07-scoring-rubrics.md.
 *
 * Everything here is data-driven and deterministic: rubrics declare
 * *detection rules* (docs/07 §4.2 `evidence_hint`, realised as typed rules),
 * the engine detects components, and levels/points are computed by the fixed
 * function of docs/07 §4.3. No model participates anywhere in this module,
 * and no random source exists — the same answer always produces the same
 * evaluation.
 */

import type { DefectReportAnswer } from '@/content/blocks';

/* ---------- detection rules (declared in rubric JSON, executed by code) ---------- */

/**
 * A field a detection rule may read.
 *
 * The nine named fields are the defect-report shape. The open string arm
 * carries the field ids of a `structured_answer` item, which declares its own
 * fields in `essaySpec` (docs/06 §3 rubric types: the artifact differs per
 * family, the scoring mechanism does not). Detection reads a named field off
 * the answer object either way, so one detection layer serves both — adding a
 * family is a content change, not an engine change.
 */
export type AnswerField =
  | 'title'
  | 'environment'
  | 'preconditions'
  | 'steps'
  | 'actual'
  | 'expected'
  | 'evidence'
  | 'severity'
  | 'severityJustification'
  | (string & {});

export type DetectionRule =
  | { readonly kind: 'non_empty'; readonly field: AnswerField }
  | { readonly kind: 'min_length'; readonly field: AnswerField; readonly n: number }
  | { readonly kind: 'min_items'; readonly field: 'steps'; readonly n: number }
  | { readonly kind: 'each_item_min_length'; readonly field: 'steps'; readonly n: number }
  | { readonly kind: 'differs_from'; readonly field: AnswerField; readonly other: AnswerField }
  | { readonly kind: 'not_generic'; readonly field: AnswerField; readonly banned: readonly string[] }
  | { readonly kind: 'not_contains'; readonly fields: readonly AnswerField[]; readonly phrases: readonly string[] }
  /**
   * The answer names a specific professional concept — the mirror of
   * `not_contains`, and the only positive detection here that is about meaning
   * rather than shape. Every other rule asks "did they write something
   * substantive"; this one asks "did they identify the right thing".
   *
   * Authoring rule, because this is the rule most able to mark a good answer
   * wrong: list every reasonable wording, Hebrew and English both, and attach
   * it to a `should` component rather than a `must`. A learner who diagnoses
   * correctly in words the author did not think of then loses some coverage
   * instead of being capped, which is the right way round for a detector that
   * cannot read. docs/07 §13 forbids keyword matching as the *sole* mechanism,
   * so a criterion using this must also carry a structural component.
   */
  | { readonly kind: 'mentions_any'; readonly fields: readonly AnswerField[]; readonly phrases: readonly string[] }
  | { readonly kind: 'severity_selected' }
  | { readonly kind: 'selected_option'; readonly optionId: string };

export type CriticalRule =
  | { readonly kind: 'expected_equals_actual' }
  | { readonly kind: 'contains_phrases'; readonly fields: readonly AnswerField[]; readonly phrases: readonly string[]; readonly labelHe: string }
  | { readonly kind: 'wrong_options_selected'; readonly validOptionIds: readonly string[]; readonly maxWrong: number; readonly labelHe: string };

/* ---------- rubric ---------- */

export interface RubricComponent {
  readonly component_id: string;
  readonly label: string;
  readonly class: 'must' | 'should' | 'alternative' | 'non_scoring';
  readonly weight: number;
  readonly replaces?: string;
  readonly detection: DetectionRule;
}

/** The progress dimension a criterion contributes to — docs/09 §2. */
export type Dimension = 'knowledge' | 'application' | 'reasoning';

export interface RubricCriterion {
  readonly criterion_id: string;
  readonly name: string;
  readonly description: string;
  readonly dimension: Dimension;
  readonly weight: number;
  readonly max_points: number;
  readonly skill_ids: readonly string[];
  readonly full_examples: readonly string[];
  readonly partial_examples: readonly string[];
  readonly missing_examples: readonly string[];
  readonly critical_errors: readonly CriticalRule[];
  readonly expected_components: readonly RubricComponent[];
  /** Remediation anchor: item id (+ optional block id) teaching this criterion. */
  readonly remediation: { readonly ref: string; readonly anchor?: string };
}

export interface RubricDoc {
  readonly rubric_id: string;
  readonly version: number;
  readonly kind: 'criteria';
  readonly status: 'draft' | 'needs_review' | 'approved' | 'active' | 'deprecated' | 'archived';
  readonly appliesTo: readonly string[];
  readonly maxScore: number;
  readonly created_at: string;
  readonly approved_at?: string;
  readonly approved_by?: string;
  readonly change_reason?: string;
  readonly effective_from?: string;
  readonly criteria: readonly RubricCriterion[];
}

/* ---------- deterministic checks (docs/07 §3) ---------- */

export interface DeterministicCheckResult {
  readonly check_id: string;
  readonly status: 'pass' | 'fail' | 'partial' | 'not_applicable';
  readonly is_gate: boolean;
  readonly score_effect: number;
  readonly score_cap: number;
  readonly error_code: string;
  readonly details: string;
}

/* ---------- evaluation result (docs/07 §17) ---------- */

export interface CriterionResult {
  readonly criterion_id: string;
  readonly criterion_name: string;
  /**
   * Copied from the rubric at evaluation time, not looked up later: a rubric
   * that re-tags a criterion must not silently rewrite what past attempts are
   * taken to have measured (the same reason docs/06 §9 stores rubricVersion).
   */
  readonly dimension: Dimension;
  readonly skill_ids: readonly string[];
  readonly weight: number;
  readonly performance_level: 0 | 1 | 2 | 3 | 4;
  readonly level_percentage: number;
  readonly coverage: number;
  readonly awarded_points: number;
  readonly max_points: number;
  readonly detected_components: readonly string[];
  readonly evidence: readonly string[];
  readonly missing_elements: readonly string[];
  readonly errors: readonly string[];
  readonly critical_error_triggered: boolean;
  readonly remediation: { readonly ref: string; readonly anchor?: string };
}

export interface EvaluationResult {
  readonly evaluation_id: string;
  readonly question_id: string;
  readonly item_version: number;
  readonly attempt_id: string;
  readonly attempt_number: number;
  readonly user_id: string;
  readonly question_type: string;
  readonly rubric_id: string;
  readonly rubric_version: number;
  readonly evaluation_version: string;
  readonly submitted_at: string;
  readonly evaluated_at: string;
  readonly answer_hash: string;
  readonly time_spent_seconds: number | null;

  readonly deterministic_checks: readonly DeterministicCheckResult[];
  readonly criterion_results: readonly CriterionResult[];

  readonly raw_score: number;
  readonly penalties: readonly { readonly reason: string; readonly points: number }[];
  readonly score_cap: number;
  readonly cap_source: string | null;
  readonly final_score: number;

  readonly confidence_level: 'high' | 'medium' | 'low' | 'requires_human_review';
  readonly confidence_reasons: readonly string[];
  readonly human_review_required: boolean;
  readonly unevaluable: boolean;

  readonly skills_measured: readonly string[];
  readonly per_skill_scores: Readonly<Record<string, number>>;
}

export const EVALUATION_VERSION = '1.0.0';

export type { DefectReportAnswer };
