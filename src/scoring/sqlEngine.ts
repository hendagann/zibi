import { createHash } from 'node:crypto';
import type { SqlDataset, SqlRunResult } from '@/sql/executor';
import { executeSql, resultsMatch } from '@/sql/executor';
import { deriveLevel, roundHalfUp } from './engine';
import type {
  CriterionResult,
  DeterministicCheckResult,
  EvaluationResult,
  RubricDoc,
} from './types';
import { EVALUATION_VERSION } from './types';

/**
 * SQL evaluation — docs/07 §9, executed for real.
 *
 * The learner's query and the exercise's reference query both RUN, on the
 * visible dataset and on every hidden fixture, and what is compared is the
 * RESULT SET — never the SQL text (§9.1). Any query returning the correct
 * results is correct, however it is written.
 *
 * Level caps follow §9.3 exactly:
 *   does not parse            → c5, c6 level 0; final capped at 40
 *   runs, wrong visible       → c5 level 0; no cap
 *   visible ok, hidden fails  → c5 ≤ level 2; c6 ≤ level 1
 *   unsafe statement          → safety gate, final = 0
 *   timeout                   → capped at 70
 *
 * Criterion applicability follows §9.2: an exercise may declare criteria
 * not-applicable (a single-table task has no join criterion) and the weights
 * redistribute proportionally, residual to the largest, total exactly 100.
 */

export interface HiddenFixture {
  readonly id: string;
  readonly labelHe: string;
  readonly extraRows: Readonly<Record<string, readonly Record<string, unknown>[]>>;
}

export interface SqlSpec {
  readonly datasetRef: string;
  readonly referenceSql: string;
  readonly orderMatters: boolean;
  readonly requiredTables: readonly string[];
  readonly notApplicableCriteria: readonly string[];
  readonly hiddenFixtures: readonly HiddenFixture[];
}

export interface SqlEvaluateInput {
  readonly sql: string;
  readonly spec: SqlSpec;
  readonly rubric: RubricDoc;
  readonly dataset: SqlDataset;
  readonly questionId: string;
  readonly itemVersion: number;
  readonly attemptId: string;
  readonly attemptNumber: number;
  readonly userId: string;
  readonly submittedAt: string;
  readonly timeSpentSeconds?: number | null;
}

interface SqlArtifacts {
  readonly executed: boolean;
  readonly learnerVisible: SqlRunResult;
  readonly visibleMatch: boolean;
  readonly visibleRowCountMatch: boolean;
  readonly columnCountMatch: boolean;
  readonly orderMatch: boolean;
  readonly hiddenResults: readonly { fixture: HiddenFixture; match: boolean }[];
  readonly hiddenAllMatch: boolean;
  readonly referencedTables: readonly string[];
}

function tablesReferenced(sql: string, known: readonly string[]): string[] {
  const lower = sql.toLowerCase();
  return known.filter((table) => new RegExp(`\\b${table}\\b`).test(lower));
}

async function buildArtifacts(input: SqlEvaluateInput): Promise<SqlArtifacts> {
  const { sql, spec, dataset } = input;
  const allTables = dataset.schema.tables.map((t) => t.name);

  const [learnerVisible, referenceVisible] = await Promise.all([
    executeSql(sql, dataset),
    executeSql(spec.referenceSql, dataset),
  ]);

  const executed = learnerVisible.ok;
  const visibleMatch =
    executed && resultsMatch(learnerVisible, referenceVisible, spec.orderMatters);
  const orderedMatch =
    executed &&
    (!spec.orderMatters || resultsMatch(learnerVisible, referenceVisible, true));
  const visibleRowCountMatch =
    executed && referenceVisible.ok && learnerVisible.rows.length === referenceVisible.rows.length;
  const columnCountMatch =
    executed && referenceVisible.ok && learnerVisible.columns.length === referenceVisible.columns.length;

  const hiddenResults: { fixture: HiddenFixture; match: boolean }[] = [];
  for (const fixture of spec.hiddenFixtures) {
    if (!executed) {
      hiddenResults.push({ fixture, match: false });
      continue;
    }
    const [learnerHidden, referenceHidden] = await Promise.all([
      executeSql(sql, dataset, fixture.extraRows),
      executeSql(spec.referenceSql, dataset, fixture.extraRows),
    ]);
    hiddenResults.push({
      fixture,
      match:
        learnerHidden.ok &&
        resultsMatch(learnerHidden, referenceHidden, spec.orderMatters),
    });
  }

  return {
    executed,
    learnerVisible,
    visibleMatch,
    visibleRowCountMatch,
    columnCountMatch,
    orderMatch: orderedMatch,
    hiddenResults,
    hiddenAllMatch: hiddenResults.every((h) => h.match),
    referencedTables: tablesReferenced(sql, allTables),
  };
}

/** Interprets a rubric component's declared SQL detection against artifacts. */
function detectSql(
  kind: string,
  input: SqlEvaluateInput,
  artifacts: SqlArtifacts,
): { detected: boolean; evidence: string } {
  const { spec, sql } = input;
  switch (kind) {
    case 'references_required_tables': {
      const missing = spec.requiredTables.filter(
        (t) => !artifacts.referencedTables.includes(t),
      );
      return {
        detected: missing.length === 0,
        evidence: missing.length ? `חסרות: ${missing.join(', ')}` : spec.requiredTables.join(', '),
      };
    }
    case 'query_executes':
      return {
        detected: artifacts.executed,
        evidence: artifacts.executed ? 'השאילתה רצה' : (artifacts.learnerVisible.errorHe ?? 'לא רצה'),
      };
    case 'column_count_match':
      return {
        detected: artifacts.columnCountMatch,
        evidence: `${artifacts.learnerVisible.columns.length} עמודות`,
      };
    case 'no_select_star':
      return {
        detected: !/select\s+\*/i.test(sql),
        evidence: /select\s+\*/i.test(sql) ? 'SELECT * במקום עמודות מפורשות' : 'עמודות מפורשות',
      };
    case 'visible_row_count_match':
      return {
        detected: artifacts.visibleRowCountMatch,
        evidence: `${artifacts.learnerVisible.rows.length} שורות`,
      };
    case 'visible_match':
      return {
        detected: artifacts.visibleMatch,
        evidence: artifacts.visibleMatch ? 'התוצאה תואמת' : 'התוצאה שונה מהמצופה',
      };
    case 'order_match':
      return {
        detected: artifacts.orderMatch,
        evidence: spec.orderMatters ? 'סדר התוצאות' : 'סדר אינו נדרש',
      };
    case 'hidden_match_all':
      return {
        detected: artifacts.hiddenAllMatch,
        evidence: `${artifacts.hiddenResults.filter((h) => h.match).length}/${artifacts.hiddenResults.length} מקרים מוסתרים`,
      };
    case 'single_clean_statement':
      return { detected: !artifacts.learnerVisible.unsafe, evidence: 'משפט יחיד' };
    case 'query_length_sane':
      return { detected: sql.trim().length <= 600, evidence: `${sql.trim().length} תווים` };
    default:
      return { detected: false, evidence: `כלל זיהוי לא מוכר: ${kind}` };
  }
}

/** §9.2 — proportional redistribution with the residual on the largest weight. */
export function redistributeWeights(
  rubric: RubricDoc,
  notApplicable: readonly string[],
): Map<string, number> {
  const applicable = rubric.criteria.filter(
    (c) => !notApplicable.includes(c.criterion_id),
  );
  const total = applicable.reduce((s, c) => s + c.weight, 0);
  const weights = new Map<string, number>();
  let assigned = 0;
  let largest: { id: string; weight: number } | null = null;
  for (const criterion of applicable) {
    const redistributed = Math.round((criterion.weight * 100 * 100) / total) / 100;
    weights.set(criterion.criterion_id, redistributed);
    assigned += redistributed;
    if (!largest || criterion.weight > largest.weight)
      largest = { id: criterion.criterion_id, weight: criterion.weight };
  }
  if (largest) {
    const residual = Math.round((100 - assigned) * 100) / 100;
    weights.set(largest.id, (weights.get(largest.id) ?? 0) + residual);
  }
  return weights;
}

export async function evaluateSql(input: SqlEvaluateInput): Promise<EvaluationResult> {
  const { rubric, spec } = input;

  const shared = {
    evaluation_id: `ev_${input.attemptId}`,
    question_id: input.questionId,
    item_version: input.itemVersion,
    attempt_id: input.attemptId,
    attempt_number: input.attemptNumber,
    user_id: input.userId,
    question_type: 'sql_query',
    rubric_id: rubric.rubric_id,
    rubric_version: rubric.version,
    evaluation_version: EVALUATION_VERSION,
    submitted_at: input.submittedAt,
    evaluated_at: input.submittedAt,
    answer_hash: createHash('sha256').update(input.sql).digest('hex').slice(0, 16),
    time_spent_seconds: input.timeSpentSeconds ?? null,
  };

  if (rubric.status !== 'active' || rubric.criteria.reduce((s, c) => s + c.weight, 0) !== 100) {
    return {
      ...shared,
      deterministic_checks: [], criterion_results: [],
      raw_score: 0, penalties: [], score_cap: 100, cap_source: 'E-GEN-008', final_score: 0,
      confidence_level: 'requires_human_review',
      confidence_reasons: ['מחוון לא פעיל או משקלים שגויים'],
      human_review_required: true, unevaluable: true,
      skills_measured: [], per_skill_scores: {},
    };
  }

  const empty = input.sql.trim().length === 0;
  const artifacts = empty ? null : await buildArtifacts(input);
  const unsafe = artifacts?.learnerVisible.unsafe ?? false;
  const timedOut = artifacts?.learnerVisible.timedOut ?? false;

  const checks: DeterministicCheckResult[] = [
    check('DC-GEN-01', 'E-GEN-001', !empty, { gate: true, details: 'הוזנה שאילתה' }),
    check('DC-SQL-02', 'E-SQL-002', !unsafe, { gate: true, details: 'קריאה בלבד, משפט יחיד' }),
    check('DC-SQL-01', 'E-SQL-001', artifacts?.executed ?? false, {
      cap: 40, details: 'השאילתה מתפרשת ורצה',
    }),
    check('DC-SQL-04', 'E-SQL-004', !timedOut, { cap: 70, details: 'בתוך מגבלת הזמן' }),
    check('DC-SQL-05', 'E-SQL-005', artifacts?.columnCountMatch ?? false, {
      details: 'מבנה התוצאה',
    }),
    check('DC-SQL-06', 'E-SQL-006', artifacts?.visibleMatch ?? false, {
      details: 'תוצאה נכונה על הנתונים הגלויים',
    }),
    check('DC-SQL-07', 'E-SQL-007', artifacts?.hiddenAllMatch ?? false, {
      details: 'תוצאה נכונה על מקרי הבדיקה המוסתרים',
    }),
  ];

  const failedGate = checks.find((c) => c.is_gate && c.status === 'fail');
  if (failedGate || !artifacts) {
    return {
      ...shared,
      deterministic_checks: checks, criterion_results: [],
      raw_score: 0, penalties: [], score_cap: 0,
      cap_source: failedGate?.error_code ?? 'E-GEN-001', final_score: 0,
      confidence_level: 'high',
      confidence_reasons: unsafe ? ['שאילתה לא בטוחה נחסמה ולא הורצה'] : [],
      human_review_required: false, unevaluable: false,
      skills_measured: [...new Set(rubric.criteria.flatMap((c) => c.skill_ids))],
      per_skill_scores: {},
    };
  }

  const weights = redistributeWeights(rubric, spec.notApplicableCriteria);

  const criterionResults: CriterionResult[] = rubric.criteria
    .filter((criterion) => !spec.notApplicableCriteria.includes(criterion.criterion_id))
    .map((criterion) => {
      const detections = criterion.expected_components.map((component) => ({
        component,
        result: detectSql(
          (component.detection as { kind: string }).kind,
          input,
          artifacts,
        ),
      }));
      const denominator = criterion.expected_components
        .filter((c) => c.class === 'must' || c.class === 'should')
        .reduce((s, c) => s + c.weight, 0);
      const detectedWeight = detections
        .filter((d) => d.component.class !== 'non_scoring' && d.result.detected)
        .reduce((s, d) => s + d.component.weight, 0);
      const coverage = denominator > 0 ? Math.min(detectedWeight / denominator, 1) : 0;
      const missingMust = detections.some(
        (d) => d.component.class === 'must' && !d.result.detected,
      );

      let level = deriveLevel(coverage, false, missingMust);
      // §9.3 level caps.
      if (!artifacts.executed && (criterion.criterion_id === 'c5' || criterion.criterion_id === 'c6')) level = 0;
      if (artifacts.executed && !artifacts.visibleMatch && criterion.criterion_id === 'c5') level = 0;
      if (artifacts.visibleMatch && !artifacts.hiddenAllMatch) {
        if (criterion.criterion_id === 'c5') level = Math.min(level, 2) as typeof level;
        if (criterion.criterion_id === 'c6') level = Math.min(level, 1) as typeof level;
      }

      const pct = [0, 25, 50, 75, 100][level] ?? 0;
      const maxPoints = weights.get(criterion.criterion_id) ?? criterion.weight;
      const awarded = Math.round(maxPoints * pct) / 100;

      return {
        criterion_id: criterion.criterion_id,
        criterion_name: criterion.name,
        dimension: criterion.dimension,
        skill_ids: criterion.skill_ids,
        weight: maxPoints,
        performance_level: level,
        level_percentage: pct,
        coverage: Math.round(coverage * 100) / 100,
        awarded_points: awarded,
        max_points: maxPoints,
        detected_components: detections.filter((d) => d.result.detected).map((d) => d.component.component_id),
        evidence: detections
          .filter((d) => d.result.detected && d.component.class !== 'non_scoring')
          .map((d) => `${d.component.label}: ${d.result.evidence}`),
        missing_elements: detections
          .filter((d) => !d.result.detected && d.component.class !== 'non_scoring')
          .map((d) => d.component.label),
        errors: [],
        critical_error_triggered: false,
        remediation: criterion.remediation,
      };
    });

  const raw = Math.round(criterionResults.reduce((s, c) => s + c.awarded_points, 0) * 100) / 100;
  const triggeredCaps = checks.filter((c) => c.status === 'fail' && c.score_cap < 100);
  const cap = triggeredCaps.length ? Math.min(...triggeredCaps.map((c) => c.score_cap)) : 100;
  const capSource = triggeredCaps.length
    ? triggeredCaps.reduce((min, c) => (c.score_cap < min.score_cap ? c : min)).error_code
    : null;
  const finalScore = roundHalfUp(Math.min(Math.max(Math.min(raw, cap), 0), 100));

  const perSkill: Record<string, { got: number; max: number }> = {};
  for (const cr of criterionResults) {
    for (const skill of cr.skill_ids) {
      const acc = (perSkill[skill] ??= { got: 0, max: 0 });
      acc.got += cr.awarded_points;
      acc.max += cr.max_points;
    }
  }

  return {
    ...shared,
    deterministic_checks: checks,
    criterion_results: criterionResults,
    raw_score: raw,
    penalties: [],
    score_cap: cap,
    cap_source: capSource,
    final_score: finalScore,
    confidence_level: 'high',
    confidence_reasons: [],
    human_review_required: false,
    unevaluable: false,
    skills_measured: [...new Set(rubric.criteria.flatMap((c) => c.skill_ids))],
    per_skill_scores: Object.fromEntries(
      Object.entries(perSkill).map(([skillId, v]) => [
        skillId,
        Math.round((v.max ? v.got / v.max : 0) * 100) / 100,
      ]),
    ),
  };
}

function check(
  check_id: string,
  error_code: string,
  ok: boolean,
  opts: { gate?: boolean; cap?: number; details?: string } = {},
): DeterministicCheckResult {
  return {
    check_id,
    status: ok ? 'pass' : 'fail',
    is_gate: opts.gate ?? false,
    score_effect: 0,
    score_cap: ok ? 100 : (opts.cap ?? 100),
    error_code,
    details: opts.details ?? '',
  };
}
