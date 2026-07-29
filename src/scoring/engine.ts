/**
 * The scoring engine — a direct implementation of docs/07:
 *
 * §3   deterministic checks with gates and caps
 * §4.3 levels computed from component coverage, never chosen
 * §5   score formula: penalties before caps, min of caps, round once, half-up
 *
 * Pure functions throughout. Given the same answer, item and rubric version,
 * the output is byte-identical — that is the reproducibility guarantee, and
 * scoring-acceptance-tests AT-SC-01/03 depend on it.
 */

import { createHash } from 'node:crypto';
import type { DefectReportAnswer } from '@/content/blocks';
import type {
  CriterionResult,
  CriticalRule,
  DetectionRule,
  DeterministicCheckResult,
  EvaluationResult,
  RubricCriterion,
  RubricDoc,
} from './types';
import { EVALUATION_VERSION } from './types';

/* ---------------- field access ---------------- */

function fieldText(answer: DefectReportAnswer, field: string): string {
  if (field === 'steps') return answer.steps.filter((s) => s.trim()).join('\n');
  const value = (answer as unknown as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}

function trimmed(answer: DefectReportAnswer, field: string): string {
  return fieldText(answer, field).trim();
}

function realSteps(answer: DefectReportAnswer): string[] {
  return answer.steps.map((s) => s.trim()).filter(Boolean);
}

/* ---------------- layer 1: deterministic checks ---------------- */

function check(
  check_id: string,
  error_code: string,
  ok: boolean,
  opts: { gate?: boolean; cap?: number; details?: string; na?: boolean } = {},
): DeterministicCheckResult {
  return {
    check_id,
    status: opts.na ? 'not_applicable' : ok ? 'pass' : 'fail',
    is_gate: opts.gate ?? false,
    score_effect: 0,
    score_cap: ok || opts.na ? 100 : (opts.cap ?? 100),
    error_code,
    details: opts.details ?? '',
  };
}

export function runDeterministicChecks(
  answer: DefectReportAnswer,
  requiresEvidence: boolean,
): DeterministicCheckResult[] {
  const steps = realSteps(answer);
  const anything =
    [answer.title, answer.environment, answer.preconditions, answer.actual, answer.expected, answer.evidence, answer.severityJustification]
      .some((f) => f.trim().length > 0) ||
    steps.length > 0 ||
    answer.severity !== '';

  const identifiable = (answer.title.trim() + answer.actual.trim()).length >= 25;

  return [
    check('DC-GEN-01', 'E-GEN-001', anything, { gate: true, details: 'תשובה לא ריקה' }),
    check('DC-BUG-01', 'E-BUG-001', steps.length > 0, { cap: 60, details: 'צעדי שחזור' }),
    check('DC-BUG-02', 'E-BUG-002', answer.actual.trim().length > 0, { cap: 60, details: 'Actual Result' }),
    check('DC-BUG-03', 'E-BUG-003', answer.expected.trim().length > 0, { cap: 60, details: 'Expected Result' }),
    check('DC-BUG-04', 'E-BUG-004', identifiable, { cap: 40, details: 'התקלה ניתנת לזיהוי מהדיווח' }),
    check('DC-BUG-05', 'E-BUG-005', answer.environment.trim().length > 0, { cap: 80, details: 'סביבת בדיקה' }),
    check('DC-BUG-06', 'E-BUG-006', answer.severity !== '', { cap: 90, details: 'חומרה' }),
    // Structured form: steps are an ordered array by construction.
    check('DC-BUG-07', 'E-BUG-007', true, { details: 'צעדים ממוספרים (מובנה)' }),
    check('DC-BUG-08', 'E-BUG-008', !requiresEvidence || answer.evidence.trim().length > 0, {
      cap: 100,
      details: 'ראיות',
      na: !requiresEvidence,
    }),
  ];
}

/* ---------------- layer 2: component detection ---------------- */

interface Detection {
  readonly detected: boolean;
  readonly evidence: string;
}

function excerpt(text: string, max = 90): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function detect(rule: DetectionRule, answer: DefectReportAnswer): Detection {
  switch (rule.kind) {
    case 'non_empty': {
      const t = trimmed(answer, rule.field);
      return { detected: t.length > 0, evidence: excerpt(t) };
    }
    case 'min_length': {
      const t = trimmed(answer, rule.field);
      return { detected: t.length >= rule.n, evidence: excerpt(t) };
    }
    case 'min_items':
      return {
        detected: realSteps(answer).length >= rule.n,
        evidence: `${realSteps(answer).length} צעדים`,
      };
    case 'each_item_min_length': {
      const steps = realSteps(answer);
      const ok = steps.length > 0 && steps.every((s) => s.length >= rule.n);
      return { detected: ok, evidence: excerpt(steps.join(' | ')) };
    }
    case 'differs_from': {
      const a = trimmed(answer, rule.field);
      const b = trimmed(answer, rule.other);
      return { detected: a.length > 0 && b.length > 0 && a !== b, evidence: excerpt(a) };
    }
    case 'not_generic': {
      const t = trimmed(answer, rule.field);
      const generic = rule.banned.some((b) => t === b || t.length < 8);
      return { detected: t.length > 0 && !generic, evidence: excerpt(t) };
    }
    case 'not_contains': {
      const joined = rule.fields.map((f) => fieldText(answer, f)).join(' ');
      const hit = rule.phrases.find((p) => joined.includes(p));
      return { detected: !hit, evidence: hit ? `נמצא: "${hit}"` : 'ניסוח נקי' };
    }
    case 'severity_selected':
      return { detected: answer.severity !== '', evidence: answer.severity || '—' };
    case 'selected_option':
      return {
        detected: (answer.diagnosis ?? []).includes(rule.optionId),
        evidence: rule.optionId,
      };
  }
}

function criticalTriggered(rule: CriticalRule, answer: DefectReportAnswer): { hit: boolean; label: string } {
  switch (rule.kind) {
    case 'expected_equals_actual': {
      const a = answer.actual.trim();
      const e = answer.expected.trim();
      return { hit: a.length > 0 && a === e, label: 'התוצאה המצופה זהה לתוצאה בפועל' };
    }
    case 'contains_phrases': {
      const joined = rule.fields.map((f) => fieldText(answer, f)).join(' ');
      const hit = rule.phrases.some((p) => joined.includes(p));
      return { hit, label: rule.labelHe };
    }
    case 'wrong_options_selected': {
      const selected = answer.diagnosis ?? [];
      const wrong = selected.filter((s) => !rule.validOptionIds.includes(s));
      return { hit: wrong.length > rule.maxWrong, label: rule.labelHe };
    }
  }
}

/* ---------------- level derivation — docs/07 §4.3, verbatim ---------------- */

const LEVEL_PERCENT = [0, 25, 50, 75, 100] as const;

export function deriveLevel(coverage: number, criticalHit: boolean, missingMust: boolean): 0 | 1 | 2 | 3 | 4 {
  let level: 0 | 1 | 2 | 3 | 4;
  if (coverage <= 0) level = 0;
  else if (coverage < 0.3) level = 1;
  else if (coverage < 0.55) level = 2;
  else if (coverage < 0.85) level = 3;
  else level = 4;
  if (criticalHit) level = Math.min(level, 1) as 0 | 1;
  if (missingMust) level = Math.min(level, 3) as 0 | 1 | 2 | 3;
  return level;
}

export function evaluateCriterion(
  criterion: RubricCriterion,
  answer: DefectReportAnswer,
): CriterionResult {
  const detections = criterion.expected_components.map((c) => ({
    component: c,
    result: detect(c.detection, answer),
  }));

  const scoringClasses = new Set(['must', 'should', 'alternative']);
  const denominator = criterion.expected_components
    .filter((c) => c.class === 'must' || c.class === 'should')
    .reduce((sum, c) => sum + c.weight, 0);
  const detectedWeight = detections
    .filter((d) => scoringClasses.has(d.component.class) && d.result.detected)
    .reduce((sum, d) => sum + d.component.weight, 0);
  const coverage = denominator > 0 ? detectedWeight / denominator : 0;

  const criticals = criterion.critical_errors.map((r) => criticalTriggered(r, answer));
  const criticalHit = criticals.some((c) => c.hit);
  const missingMust = detections.some(
    (d) => d.component.class === 'must' && !d.result.detected,
  );

  const level = deriveLevel(Math.min(coverage, 1), criticalHit, missingMust);
  const pct = LEVEL_PERCENT[level];
  const awarded = round2((criterion.max_points * pct) / 100);

  return {
    criterion_id: criterion.criterion_id,
    criterion_name: criterion.name,
    dimension: criterion.dimension,
    skill_ids: criterion.skill_ids,
    weight: criterion.weight,
    performance_level: level,
    level_percentage: pct,
    coverage: round2(Math.min(coverage, 1)),
    awarded_points: awarded,
    max_points: criterion.max_points,
    detected_components: detections.filter((d) => d.result.detected).map((d) => d.component.component_id),
    evidence: detections
      .filter((d) => d.result.detected && scoringClasses.has(d.component.class))
      .map((d) => `${d.component.label}: ${d.result.evidence}`),
    missing_elements: detections
      .filter((d) => !d.result.detected && d.component.class !== 'non_scoring')
      .map((d) => d.component.label),
    errors: criticals.filter((c) => c.hit).map((c) => c.label),
    critical_error_triggered: criticalHit,
    remediation: criterion.remediation,
  };
}

/* ---------------- score computation — docs/07 §5.1 ---------------- */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** round_half_up: 62.5 → 63 (docs/07 §5.2). */
export function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5);
}

export interface EvaluateInput {
  readonly answer: DefectReportAnswer;
  readonly rubric: RubricDoc;
  readonly questionId: string;
  readonly itemVersion: number;
  readonly questionType: string;
  readonly attemptId: string;
  readonly attemptNumber: number;
  readonly userId: string;
  readonly submittedAt: string;
  readonly requiresEvidence: boolean;
  readonly timeSpentSeconds?: number | null;
}

export function evaluate(input: EvaluateInput): EvaluationResult {
  const { answer, rubric } = input;

  if (rubric.status !== 'active') {
    // docs/07 §15: only an active rubric may score. AT-SC-31/39.
    return unevaluable(input, 'E-GEN-008', `מחוון ${rubric.rubric_id} אינו active`);
  }
  const weightSum = rubric.criteria.reduce((s, c) => s + c.weight, 0);
  if (weightSum !== 100) {
    return unevaluable(input, 'E-GEN-008', `משקלי המחוון מסתכמים ל-${weightSum}`);
  }

  const checks = runDeterministicChecks(answer, input.requiresEvidence);

  const failedGate = checks.find((c) => c.is_gate && c.status === 'fail');
  if (failedGate) {
    return {
      ...base(input, checks, []),
      raw_score: 0,
      penalties: [],
      score_cap: 0,
      cap_source: failedGate.error_code,
      final_score: 0,
      confidence_level: 'high',
      confidence_reasons: ['שער דטרמיניסטי נכשל'],
      human_review_required: false,
      unevaluable: false,
      skills_measured: skillsOf(rubric),
      per_skill_scores: {},
    };
  }

  const criterionResults = rubric.criteria.map((c) => evaluateCriterion(c, answer));

  const raw = round2(criterionResults.reduce((s, c) => s + c.awarded_points, 0));
  // Penalties before caps; the effective cap is the minimum of triggered caps
  // and never stacks (docs/07 §5.2–5.3, AT-SC-22/23).
  const penalised = raw;
  const triggeredCaps = checks.filter((c) => c.status === 'fail' && c.score_cap < 100);
  const cap = triggeredCaps.length
    ? Math.min(...triggeredCaps.map((c) => c.score_cap))
    : 100;
  const capSource = triggeredCaps.length
    ? triggeredCaps.reduce((min, c) => (c.score_cap < min.score_cap ? c : min)).error_code
    : null;
  const finalScore = roundHalfUp(Math.min(Math.max(Math.min(penalised, cap), 0), 100));

  const perSkill: Record<string, { got: number; max: number }> = {};
  for (const cr of criterionResults) {
    for (const skill of cr.skill_ids) {
      const acc = (perSkill[skill] ??= { got: 0, max: 0 });
      acc.got += cr.awarded_points;
      acc.max += cr.max_points;
    }
  }
  const per_skill_scores = Object.fromEntries(
    Object.entries(perSkill).map(([skillId, v]) => [skillId, round2(v.max ? v.got / v.max : 0)]),
  );

  return {
    ...base(input, checks, criterionResults),
    raw_score: raw,
    penalties: [],
    score_cap: cap,
    cap_source: capSource,
    final_score: finalScore,
    // Detection is deterministic rules over a structured form — docs/07 §20:
    // no ambiguity, so confidence is high. Linguistic-quality judgement is
    // deferred to the AI phase and is not claimed here.
    confidence_level: 'high',
    confidence_reasons: [],
    human_review_required: false,
    unevaluable: false,
    skills_measured: skillsOf(rubric),
    per_skill_scores,
  };
}

function skillsOf(rubric: RubricDoc): string[] {
  return [...new Set(rubric.criteria.flatMap((c) => c.skill_ids))];
}

function base(
  input: EvaluateInput,
  checks: readonly DeterministicCheckResult[],
  criteria: readonly EvaluationResult['criterion_results'][number][],
) {
  return {
    evaluation_id: `ev_${input.attemptId}`,
    question_id: input.questionId,
    item_version: input.itemVersion,
    attempt_id: input.attemptId,
    attempt_number: input.attemptNumber,
    user_id: input.userId,
    question_type: input.questionType,
    rubric_id: input.rubric.rubric_id,
    rubric_version: input.rubric.version,
    evaluation_version: EVALUATION_VERSION,
    submitted_at: input.submittedAt,
    evaluated_at: input.submittedAt,
    answer_hash: createHash('sha256').update(JSON.stringify(input.answer)).digest('hex').slice(0, 16),
    time_spent_seconds: input.timeSpentSeconds ?? null,
    deterministic_checks: checks,
    criterion_results: criteria,
  };
}

function unevaluable(input: EvaluateInput, code: string, details: string): EvaluationResult {
  // A broken item is our defect, never the learner's zero — docs/07 §16.18.
  return {
    ...base(input, [], []),
    raw_score: 0,
    penalties: [],
    score_cap: 100,
    cap_source: code,
    final_score: 0,
    confidence_level: 'requires_human_review',
    confidence_reasons: [details],
    human_review_required: true,
    unevaluable: true,
    skills_measured: [],
    per_skill_scores: {},
  };
}
