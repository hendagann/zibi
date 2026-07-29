import { describe, expect, it } from 'vitest';
import type { AttemptRecord } from '@/storage/attempts';
import type { CriterionResult, Dimension } from '@/scoring/types';
import {
  computeProgress,
  computeSkillProgress,
  computeStability,
  computeTrendSlope,
  speedScoreFromRatio,
  weightAttempts,
} from './compute';

/**
 * The defining test of this module is the first one: sequences that share a
 * mean must not share a report. Everything else exists to keep that honest.
 */

// Close behind the fixture dates (2026-07-01..09) so the staleness rule does
// not fire in every test. The staleness case sets its own older dates.
const NOW = new Date('2026-07-10T12:00:00.000Z');
const SKILL = 'DOC.BUG';

function criterion(
  id: string,
  dimension: Dimension,
  awarded: number,
  max: number,
  extras: Partial<CriterionResult> = {},
): CriterionResult {
  return {
    criterion_id: id,
    criterion_name: id,
    dimension,
    skill_ids: [SKILL],
    weight: max,
    performance_level: 2,
    level_percentage: 50,
    coverage: 0.5,
    awarded_points: awarded,
    max_points: max,
    detected_components: [],
    evidence: [],
    missing_elements: [],
    errors: [],
    critical_error_triggered: false,
    remediation: { ref: 'DOC-defects.LE.001', anchor: 'sec-steps' },
    ...extras,
  };
}

interface AttemptOpts {
  readonly itemId?: string;
  readonly day?: number;
  readonly seconds?: number | null;
  readonly criteria?: readonly CriterionResult[];
  readonly skills?: readonly string[];
}

function attempt(score: number, n: number, opts: AttemptOpts = {}): AttemptRecord {
  const itemId = opts.itemId ?? `DOC-defects.EX.00${n}`;
  const day = String(opts.day ?? n).padStart(2, '0');
  return {
    attempt_id: `a-${itemId}-${n}`,
    user_id: 'local',
    item_id: itemId,
    item_version: 1,
    attempt_number: n,
    submitted_at: `2026-07-${day}T10:00:00.000Z`,
    answer: { sql: '' },
    evaluation: {
      evaluation_id: `ev-${itemId}-${n}`,
      question_id: itemId,
      item_version: 1,
      attempt_id: `a-${itemId}-${n}`,
      attempt_number: n,
      user_id: 'local',
      question_type: 'author_defect_report',
      rubric_id: 'RUB.BUG_REPORT',
      rubric_version: 1,
      evaluation_version: '1.0.0',
      submitted_at: `2026-07-${day}T10:00:00.000Z`,
      evaluated_at: `2026-07-${day}T10:00:00.000Z`,
      answer_hash: 'x',
      time_spent_seconds: opts.seconds === undefined ? null : opts.seconds,
      deterministic_checks: [],
      criterion_results: opts.criteria ?? [],
      raw_score: score,
      penalties: [],
      score_cap: 100,
      cap_source: null,
      final_score: score,
      confidence_level: 'high',
      confidence_reasons: [],
      human_review_required: false,
      unevaluable: false,
      skills_measured: opts.skills ?? [SKILL],
      per_skill_scores: { [SKILL]: score / 100 },
    },
  };
}

/** One attempt per distinct item, one per day — the "all fresh" case. */
function sequence(scores: readonly number[], opts: AttemptOpts = {}): AttemptRecord[] {
  return scores.map((score, i) =>
    attempt(score, i + 1, { ...opts, itemId: `DOC-defects.EX.0${i + 1}`, day: i + 1 }),
  );
}

const progress = (attempts: readonly AttemptRecord[]) =>
  computeSkillProgress(SKILL, attempts, { now: NOW });

describe('the same mean must not produce the same report', () => {
  it('separates improving from declining', () => {
    const improving = progress(sequence([40, 60, 90]))!;
    const declining = progress(sequence([90, 60, 40]))!;

    // Identical on the measure the model refuses to lead with.
    expect(improving.mean).toBe(declining.mean);

    // Different on every measure that matters.
    expect(improving.ability).toBeGreaterThan(declining.ability);
    expect(improving.trend).toBe('improving');
    expect(declining.trend).toBe('declining');
    expect(improving.latest).toBe(90);
    expect(declining.latest).toBe(40);
    expect(declining.needsReview).toBe(true);
    expect(improving.needsReview).toBe(false);
  });

  it('flags the erratic learner whose mean is the highest of all', () => {
    const erratic = progress(sequence([90, 40, 90]))!;
    const steady = progress(sequence([63, 64, 63]))!;

    expect(erratic.mean).toBeGreaterThan(steady.mean);
    // …and yet the erratic learner is the one who needs work.
    expect(erratic.stabilityLevel).toBe('low');
    expect(steady.stabilityLevel).toBe('high');
    // The improving learner spans the same 50 points but is predictable.
    expect(progress(sequence([40, 60, 90]))!.stabilityLevel).toBe('high');
    expect(erratic.needsReview).toBe(true);
    expect(erratic.confidence).not.toBe('high');
  });

  it('the stuck learner is steady, not improving', () => {
    const stuck = progress(sequence([63, 64, 63]))!;
    expect(stuck.trend).toBe('steady');
    expect(stuck.needsReview).toBe(true);
    expect(stuck.reviewReasons.map((r) => r.code)).toContain('latest_below_pass');
  });
});

describe('weighting', () => {
  it('recency dominates: the newest attempt carries the most weight', () => {
    const weighted = weightAttempts(sequence([40, 60, 90]), (a) => a.evaluation.final_score);
    expect(weighted.map((w) => w.score)).toEqual([40, 60, 90]);
    expect(weighted[2]!.weight).toBeGreaterThan(weighted[1]!.weight);
    expect(weighted[1]!.weight).toBeGreaterThan(weighted[0]!.weight);
  });

  it('a repeat of the same item counts less than a first attempt', () => {
    const repeats = [
      attempt(50, 1, { itemId: 'X.EX.001', day: 1 }),
      attempt(100, 2, { itemId: 'X.EX.001', day: 2 }),
    ];
    const fresh = [
      attempt(50, 1, { itemId: 'X.EX.001', day: 1 }),
      attempt(100, 1, { itemId: 'X.EX.002', day: 2 }),
    ];
    const viaRepeat = progress(repeats)!;
    const viaFresh = progress(fresh)!;

    expect(viaRepeat.mean).toBe(viaFresh.mean);
    // Solving a new item cold is stronger evidence than acing the one whose
    // feedback you just read.
    expect(viaFresh.ability).toBeGreaterThan(viaRepeat.ability);
  });

  it('grinding one exercise to 100 does not look like mastery', () => {
    const grind = [
      attempt(30, 1, { itemId: 'X.EX.001', day: 1 }),
      attempt(70, 2, { itemId: 'X.EX.001', day: 2 }),
      attempt(100, 3, { itemId: 'X.EX.001', day: 3 }),
      attempt(100, 4, { itemId: 'X.EX.001', day: 4 }),
    ];
    const result = progress(grind)!;
    expect(result.freshFirstAttemptRate).toBe(0);
    expect(result.reviewReasons.map((r) => r.code)).toContain('repeats_only');
    expect(result.confidence).not.toBe('high');
    expect(result.distinctItems).toBe(1);
  });

  it('credits genuine first-time success on new items', () => {
    const cold = progress(sequence([85, 90, 88]))!;
    expect(cold.freshFirstAttemptRate).toBe(1);
    expect(cold.reviewReasons.map((r) => r.code)).not.toContain('repeats_only');
    expect(cold.confidence).toBe('high');
  });
});

describe('trend and stability', () => {
  it('needs three points before claiming a trend', () => {
    expect(computeTrendSlope([50, 90])).toBeNull();
    expect(computeTrendSlope([50, 70, 90])).toBe(20);
  });

  it('measures deviation from the trend, not the raw span', () => {
    // Steady improvement spans 50 points but is entirely predictable.
    const improving = computeStability([40, 60, 90])!;
    expect(improving.range).toBe(50);
    expect(improving.residualRange).toBeLessThanOrEqual(10);
    expect(improving.level).toBe('high');

    // The same span with no direction is not predictable at all.
    const erratic = computeStability([90, 40, 90])!;
    expect(erratic.range).toBe(50);
    expect(erratic.residualRange).toBeGreaterThan(25);
    expect(erratic.level).toBe('low');

    expect(computeStability([80, 82, 85])!.level).toBe('high');
    expect(computeStability([40, 90, 60])!.level).toBe('low');
    expect(computeStability([80])).toBeNull();
  });

  it('looks only at the recent window, not all history', () => {
    // Ancient volatility does not make a currently steady learner unstable.
    const scores = [10, 95, 20, 80, 81, 82, 83, 80];
    expect(computeStability(scores)!.level).toBe('high');
  });
});

describe('dimensions', () => {
  it('reports null with no evidence rather than zero', () => {
    const result = progress(sequence([70, 80, 90]))!;
    // These attempts carry no criterion results at all.
    expect(result.dimensions.knowledge).toBeNull();
    expect(result.dimensions.reasoning).toBeNull();
    expect(result.dimensions.speed).toBeNull();
  });

  it('separates knowledge, application and reasoning from tagged criteria', () => {
    const criteria = [
      criterion('c1', 'knowledge', 10, 10),
      criterion('c2', 'application', 5, 10),
      criterion('c3', 'reasoning', 0, 10),
    ];
    const result = progress([attempt(50, 1, { criteria, itemId: 'X.EX.001' })])!;
    expect(result.dimensions.knowledge).toBe(100);
    expect(result.dimensions.application).toBe(50);
    expect(result.dimensions.reasoning).toBe(0);
  });

  it('scores speed from the ratio to the expected duration', () => {
    expect(speedScoreFromRatio(0.5)).toBe(100);
    expect(speedScoreFromRatio(1)).toBe(100);
    expect(speedScoreFromRatio(2)).toBe(50);
    expect(speedScoreFromRatio(3)).toBe(0);
    expect(speedScoreFromRatio(10)).toBe(0);
  });

  it('uses a median so one abandoned tab does not destroy the speed figure', () => {
    const attempts = [
      attempt(80, 1, { itemId: 'X.EX.001', day: 1, seconds: 300 }),
      attempt(80, 1, { itemId: 'X.EX.002', day: 2, seconds: 320 }),
      // Opened the exercise and came back much later.
      attempt(80, 1, { itemId: 'X.EX.003', day: 3, seconds: 6000 }),
    ];
    const result = computeSkillProgress(SKILL, attempts, {
      now: NOW,
      estimatedSecondsByItem: {
        'X.EX.001': 300,
        'X.EX.002': 300,
        'X.EX.003': 300,
      },
    })!;
    // Median ratio is 320/300 ≈ 1.07, not the 7.3 the outlier would impose.
    expect(result.dimensions.speed).toBeGreaterThan(90);
  });

  it('excludes attempts with no recorded duration — unmeasured is not fast', () => {
    const attempts = [
      attempt(80, 1, { itemId: 'X.EX.001', day: 1, seconds: null }),
      attempt(80, 1, { itemId: 'X.EX.002', day: 2, seconds: 600 }),
    ];
    const result = computeSkillProgress(SKILL, attempts, {
      now: NOW,
      estimatedSecondsByItem: { 'X.EX.001': 300, 'X.EX.002': 300 },
    })!;
    // Only the 600/300 = 2.0 ratio counts.
    expect(result.dimensions.speed).toBe(50);
  });
});

describe('recurring errors', () => {
  it('flags a label that appears in two or more attempts', () => {
    const withMissing = (labels: string[]) => [
      criterion('c4', 'application', 0, 22, { missing_elements: labels }),
    ];
    const attempts = [
      attempt(50, 1, { itemId: 'X.EX.001', day: 1, criteria: withMissing(['לפחות שני צעדים']) }),
      attempt(60, 1, { itemId: 'X.EX.002', day: 2, criteria: withMissing(['לפחות שני צעדים']) }),
      attempt(70, 1, { itemId: 'X.EX.003', day: 3, criteria: withMissing(['ראיות צוינו']) }),
    ];
    const result = progress(attempts)!;
    expect(result.recurringErrors.map((e) => e.label)).toEqual(['לפחות שני צעדים']);
    expect(result.recurringErrors[0]!.occurrences).toBe(2);
    expect(result.recurringErrors[0]!.remediation?.anchor).toBe('sec-steps');
    expect(result.reviewReasons.map((r) => r.code)).toContain('recurring_error');
  });

  it('does not count one attempt listing the same label twice', () => {
    const attempts = [
      attempt(50, 1, {
        itemId: 'X.EX.001',
        criteria: [
          criterion('c4', 'application', 0, 10, { missing_elements: ['אותו דבר'] }),
          criterion('c5', 'application', 0, 10, { missing_elements: ['אותו דבר'] }),
        ],
      }),
    ];
    expect(progress(attempts)!.recurringErrors).toEqual([]);
  });
});

describe('confidence and staleness', () => {
  it('one attempt is low confidence however good the score', () => {
    const result = progress(sequence([100]))!;
    expect(result.confidence).toBe('low');
    expect(result.ability).toBe(100);
  });

  it('evidence from a single item never reaches high confidence', () => {
    const oneItem = [
      attempt(90, 1, { itemId: 'X.EX.001', day: 1 }),
      attempt(92, 2, { itemId: 'X.EX.001', day: 2 }),
      attempt(91, 3, { itemId: 'X.EX.001', day: 3 }),
    ];
    expect(progress(oneItem)!.confidence).toBe('medium');
  });

  it('flags a skill not practised for three weeks', () => {
    const old = sequence([90, 92, 95]).map((a) => ({
      ...a,
      submitted_at: '2026-06-01T10:00:00.000Z',
      evaluation: { ...a.evaluation, submitted_at: '2026-06-01T10:00:00.000Z' },
    }));
    const result = progress(old)!;
    expect(result.reviewReasons.map((r) => r.code)).toContain('stale');
    expect(result.confidence).not.toBe('high');
  });
});

describe('determinism and edge cases', () => {
  it('produces an identical result on every run', () => {
    const attempts = sequence([40, 60, 90]);
    const first = progress(attempts);
    for (let i = 0; i < 5; i++) {
      expect(progress(attempts)).toEqual(first);
    }
  });

  it('ignores unevaluable attempts entirely', () => {
    const broken = attempt(0, 1, { itemId: 'X.EX.009', day: 9 });
    const attempts = [
      ...sequence([90, 92]),
      { ...broken, evaluation: { ...broken.evaluation, unevaluable: true } },
    ];
    const result = progress(attempts)!;
    expect(result.attempts).toBe(2);
    expect(result.latest).toBe(92);
  });

  it('returns null for a skill with no attempts', () => {
    expect(computeSkillProgress('TECH.SQL', sequence([90]), { now: NOW })).toBeNull();
  });

  it('reports nothing at all for an empty log', () => {
    const overall = computeProgress([], [SKILL], { now: NOW });
    expect(overall.skills).toEqual([]);
    expect(overall.ability).toBeNull();
    expect(overall.totalAttempts).toBe(0);
  });
});

describe('aggregation', () => {
  it('weights topic ability by attempt count, not by skill count', () => {
    const many = sequence([90, 90, 90]);
    const one = [attempt(10, 1, { itemId: 'Y.EX.001', day: 7, skills: ['DOC.ADV'] })].map((a) => ({
      ...a,
      evaluation: {
        ...a.evaluation,
        skills_measured: ['DOC.ADV'],
        per_skill_scores: { 'DOC.ADV': 0.1 },
      },
    }));
    const overall = computeProgress([...many, ...one], [SKILL, 'DOC.ADV'], {
      now: NOW,
      topicBySkill: { [SKILL]: 'DOC/defects', 'DOC.ADV': 'DOC/defects' },
    });
    const topic = overall.topics.find((t) => t.topicId === 'DOC/defects')!;
    expect(topic.skills).toHaveLength(2);
    // Three strong attempts outweigh one weak one: a plain mean of the two
    // skills would give 50.
    expect(topic.ability).toBeGreaterThan(60);
    expect(topic.needsReview).toBe(true);
  });
});
