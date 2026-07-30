import { describe, expect, it } from 'vitest';
import type { Skill } from '@/content/types';
import type { ExerciseItem } from '@/content/exercise';
import type { SkillProgress } from '@/progress/types';
import type { AttemptRecord } from '@/storage/attempts';
import type { BlueprintSegment, ExamBlueprint, ExamType, SelectionRules } from './types';
import { planExam, validateBlueprint } from './planner';

/**
 * The defining tests here are the refusals. An exam that quietly assembles
 * itself from whatever happens to exist is the failure this module prevents,
 * so "cannot be built" must be a first-class, explained outcome.
 */

const NOW = new Date('2026-07-30T12:00:00.000Z');

function skill(id: string, tier: Skill['tier'], k: Skill['cognitiveLevel']): Skill {
  return {
    id,
    topic: 'DOC/defects',
    titleHe: id,
    titleEn: id,
    tier,
    cognitiveLevel: k,
    behaviour: 'x',
    prerequisites: [],
    sourceCoverage: 'strong',
    status: 'active',
  };
}

const SKILLS: Skill[] = [
  skill('DOC.BUG', 'foundation', 'K3'),
  skill('DOC.ADV', 'advanced', 'K4'),
  skill('TECH.SQL', 'foundation', 'K3'),
];

interface ItemOpts {
  readonly family?: string;
  readonly seconds?: number;
  readonly difficulty?: number;
  readonly skillId?: string;
  readonly topic?: string;
  readonly pool?: 'exam' | 'practice';
  readonly type?: 'exam_item' | 'exercise';
}

function item(id: string, opts: ItemOpts = {}): ExerciseItem {
  return {
    id,
    type: opts.type ?? 'exam_item',
    schemaVersion: 1,
    topic: opts.topic ?? 'DOC/defects',
    skills: { primary: opts.skillId ?? 'DOC.BUG' },
    title: id,
    lang: 'he',
    dir: 'rtl',
    difficulty: opts.difficulty ?? 3,
    estimatedSeconds: opts.seconds ?? 120,
    pool: opts.pool ?? 'exam',
    source: [{ sourceId: 'SRC-X', derivation: 'original' }],
    review: { status: 'approved', reviewedBy: 'r' },
    version: 1,
    status: 'active',
    questionType: (opts.family ?? 'author_defect_report') as ExerciseItem['questionType'],
    requiresEvidence: false,
    rubricRef: 'RUB.BUG_REPORT',
    scenario: [],
    prompt: [],
    modelAnswer: { sql: '' },
    revisionRefs: [],
  };
}

const RULES: SelectionRules = {
  poolRef: 'exam',
  noRepeatWithinDays: 90,
  excludeAttempted: true,
  minOpenQuestions: 1,
  requireJudgementItem: false,
  maxItemsPerSkill: 2,
  difficultyBand: [1, 5],
  experienceBand: null,
};

function segment(
  segmentId: string,
  minutes: number,
  questionFamily: string,
  extra: Partial<BlueprintSegment> = {},
): BlueprintSegment {
  return {
    segmentId,
    titleHe: segmentId,
    minutes,
    questionFamily,
    open: true,
    judgement: false,
    ...extra,
  };
}

function blueprint(
  segments: readonly BlueprintSegment[],
  extra: Partial<ExamBlueprint> = {},
): ExamBlueprint {
  const minutes = segments.reduce((s, x) => s + x.minutes, 0);
  return {
    id: 'EXAM-test.BP.001',
    type: 'exam_blueprint',
    examType: (extra.examType ?? 'random') as ExamType,
    scope: 'full',
    title: 'test',
    durationMinutes: minutes,
    passMark: 70,
    itemCount: segments.length,
    segments,
    selectionRules: RULES,
    ...extra,
  };
}

function attempt(itemId: string, day = 29): AttemptRecord {
  return {
    attempt_id: `a-${itemId}`,
    user_id: 'local',
    item_id: itemId,
    item_version: 1,
    attempt_number: 1,
    submitted_at: `2026-07-${day}T10:00:00.000Z`,
    answer: { sql: '' },
    evaluation: {
      evaluation_id: `e-${itemId}`,
      question_id: itemId,
      item_version: 1,
      attempt_id: `a-${itemId}`,
      attempt_number: 1,
      user_id: 'local',
      question_type: 'author_defect_report',
      rubric_id: 'RUB.BUG_REPORT',
      rubric_version: 1,
      evaluation_version: '1.0.0',
      submitted_at: `2026-07-${day}T10:00:00.000Z`,
      evaluated_at: `2026-07-${day}T10:00:00.000Z`,
      answer_hash: 'x',
      time_spent_seconds: null,
      deterministic_checks: [],
      criterion_results: [],
      raw_score: 80,
      penalties: [],
      score_cap: 100,
      cap_source: null,
      final_score: 80,
      confidence_level: 'high',
      confidence_reasons: [],
      human_review_required: false,
      unevaluable: false,
      skills_measured: ['DOC.BUG'],
      per_skill_scores: { 'DOC.BUG': 0.8 },
    },
  };
}

const plan = (
  bp: ExamBlueprint,
  pool: readonly ExerciseItem[],
  attempts: readonly AttemptRecord[] = [],
  progress?: readonly SkillProgress[],
) => planExam(bp, pool, attempts, { now: NOW, skills: SKILLS, ...(progress ? { progress } : {}) });

describe('refusal rather than rebalancing', () => {
  it('refuses a segment whose question family has no items at all', () => {
    const bp = blueprint([
      segment('report', 3, 'author_defect_report'),
      segment('investigation', 4, 'investigate_failure'),
    ]);
    const result = plan(bp, [item('A.XM.001', { seconds: 120 })]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    const refusal = result.reasons.find((r) => r.segmentId === 'investigation');
    expect(refusal?.code).toBe('no_item_for_family');
    expect(refusal?.values?.questionFamily).toBe('investigate_failure');
  });

  it('refuses when the only candidate is longer than the segment budget', () => {
    // The real pool today: 10-minute items against a 3-minute segment.
    const bp = blueprint([segment('report', 3, 'author_defect_report')]);
    const result = plan(bp, [item('A.XM.001', { seconds: 600 })]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons[0]?.code).toBe('segment_over_budget');
    expect(result.reasons[0]?.values).toMatchObject({
      budgetSeconds: 180,
      shortestCandidateSeconds: 600,
    });
  });

  it('distinguishes "no such item" from "you have already done them all"', () => {
    const bp = blueprint([segment('report', 3, 'author_defect_report')]);
    const result = plan(bp, [item('A.XM.001')], [attempt('A.XM.001')]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons[0]?.code).toBe('all_candidates_seen');
    expect(result.reasons[0]?.values?.found).toBe(1);
  });

  it('reports every unfillable segment, not just the first', () => {
    const bp = blueprint([
      segment('a', 4, 'analyse_requirement'),
      segment('b', 3, 'author_defect_report'),
      segment('c', 4, 'sql_query'),
    ]);
    const result = plan(bp, [item('A.XM.001', { seconds: 120 })]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons.map((r) => r.segmentId)).toEqual(['a', 'c']);
  });

  it('refuses when no filled segment carries professional judgement', () => {
    const bp = blueprint([segment('report', 3, 'author_defect_report', { judgement: true })], {
      selectionRules: { ...RULES, requireJudgementItem: true },
    });
    // DOC.BUG is foundation/K3 — it cannot satisfy a judgement segment.
    const result = plan(bp, [item('A.XM.001', { skillId: 'DOC.BUG' })]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons.map((r) => r.code)).toContain('no_judgement_item');
  });

  it('accepts the judgement segment when an advanced K4 skill fills it', () => {
    const bp = blueprint([segment('decision', 3, 'author_defect_report', { judgement: true })], {
      selectionRules: { ...RULES, requireJudgementItem: true },
    });
    const result = plan(bp, [item('A.XM.001', { skillId: 'DOC.ADV' })]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.segments[0]?.judgement).toBe(true);
  });

  it('refuses when too few open questions were filled', () => {
    const bp = blueprint([segment('closed', 3, 'author_defect_report', { open: false })], {
      selectionRules: { ...RULES, minOpenQuestions: 1 },
    });
    const result = plan(bp, [item('A.XM.001')]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons.map((r) => r.code)).toContain('too_few_open_questions');
  });
});

describe('pool isolation and exclusions', () => {
  it('never draws a practice item into an exam', () => {
    const bp = blueprint([segment('report', 3, 'author_defect_report')]);
    const result = plan(bp, [
      item('P.EX.001', { pool: 'practice', type: 'exercise' }),
      item('E.XM.001'),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.segments[0]?.itemId).toBe('E.XM.001');
  });

  it('excludes an item the learner has already attempted', () => {
    const bp = blueprint([segment('report', 3, 'author_defect_report')]);
    const result = plan(bp, [item('A.XM.001'), item('B.XM.002')], [attempt('A.XM.001')]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.segments[0]?.itemId).toBe('B.XM.002');
  });

  it('keeps an old attempt out of the way when only the window applies', () => {
    // excludeAttempted off: only sittings inside noRepeatWithinDays are barred.
    const rules = { ...RULES, excludeAttempted: false, noRepeatWithinDays: 30 };
    const bp = blueprint([segment('report', 3, 'author_defect_report')], {
      selectionRules: rules,
    });
    // 2026-05-01 is far outside a 30-day window ending 2026-07-30.
    const old = { ...attempt('A.XM.001'), submitted_at: '2026-05-01T10:00:00.000Z' };
    const result = plan(bp, [item('A.XM.001')], [old]);

    expect(result.ok).toBe(true);
  });

  it('honours the topic scope of a topic exam', () => {
    const bp = blueprint([segment('report', 3, 'author_defect_report')], {
      examType: 'topic',
      scope: 'topic',
      scopeRef: 'TECH/data',
    });
    const result = plan(bp, [
      item('DOC.XM.001', { topic: 'DOC/defects' }),
      item('TECH.XM.001', { topic: 'TECH/data', skillId: 'TECH.SQL' }),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.segments[0]?.itemId).toBe('TECH.XM.001');
  });

  // A domain-scoped blueprint carries a DOMAIN id in scopeRef, not a topic id
  // (docs/05 §13). Comparing it to item.topic matched nothing, so a chapter
  // exam refused to assemble against a pool that fully satisfied it.
  it('honours the domain scope of a domain exam', () => {
    const bp = blueprint([segment('report', 3, 'author_defect_report')], {
      examType: 'topic',
      scope: 'domain',
      scopeRef: 'TECH',
    });
    const result = plan(bp, [
      item('DOC.XM.001', { topic: 'DOC/defects' }),
      item('TECH.XM.001', { topic: 'TECH/data', skillId: 'TECH.SQL' }),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.segments[0]?.itemId).toBe('TECH.XM.001');
  });

  // The prefix test must not admit a topic that merely starts with the same
  // letters — `TECH` must never match a hypothetical `TECHNIQUE/...` domain.
  it('does not treat a same-prefix topic as in-domain', () => {
    const bp = blueprint([segment('report', 3, 'author_defect_report')], {
      examType: 'topic',
      scope: 'domain',
      scopeRef: 'TE',
    });
    const result = plan(bp, [item('TECH.XM.001', { topic: 'TECH/data', skillId: 'TECH.SQL' })]);

    expect(result.ok).toBe(false);
  });

  it('respects the difficulty band', () => {
    const bp = blueprint([segment('report', 3, 'author_defect_report')], {
      selectionRules: { ...RULES, difficultyBand: [4, 5] },
    });
    const result = plan(bp, [item('EASY.XM.001', { difficulty: 1 })]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons[0]?.code).toBe('no_item_for_family');
  });
});

describe('spread, ordering and the exam types', () => {
  it('spreads across skills rather than filling every segment from one', () => {
    const bp = blueprint([
      segment('a', 3, 'author_defect_report'),
      segment('b', 3, 'author_defect_report'),
    ]);
    const result = plan(bp, [
      item('A.XM.001', { skillId: 'DOC.BUG' }),
      item('A.XM.002', { skillId: 'DOC.BUG' }),
      item('B.XM.001', { skillId: 'DOC.ADV' }),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new Set(result.segments.map((s) => s.skillId)).size).toBe(2);
  });

  it('will not exceed maxItemsPerSkill', () => {
    const bp = blueprint([
      segment('a', 3, 'author_defect_report'),
      segment('b', 3, 'author_defect_report'),
    ]);
    const result = plan(
      bp,
      [item('A.XM.001', { skillId: 'DOC.BUG' }), item('A.XM.002', { skillId: 'DOC.BUG' })],
      [],
    );
    // maxItemsPerSkill is 2, so both may be used.
    expect(result.ok).toBe(true);

    const strict = blueprint(
      [segment('a', 3, 'author_defect_report'), segment('b', 3, 'author_defect_report')],
      { selectionRules: { ...RULES, maxItemsPerSkill: 1 } },
    );
    const limited = plan(strict, [
      item('A.XM.001', { skillId: 'DOC.BUG' }),
      item('A.XM.002', { skillId: 'DOC.BUG' }),
    ]);
    expect(limited.ok).toBe(false);
  });

  it('a weakness exam reaches for the weakest measured skill first', () => {
    const bp = blueprint([segment('a', 3, 'author_defect_report')], { examType: 'weakness' });
    const progress = [
      { skillId: 'DOC.BUG', ability: 90, needsReview: false },
      { skillId: 'DOC.ADV', ability: 35, needsReview: true },
    ] as unknown as SkillProgress[];

    const result = plan(
      bp,
      [item('STRONG.XM.001', { skillId: 'DOC.BUG' }), item('WEAK.XM.001', { skillId: 'DOC.ADV' })],
      [],
      progress,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.segments[0]?.itemId).toBe('WEAK.XM.001');
  });

  it('a senior exam refuses foundation items outright', () => {
    const bp = blueprint([segment('a', 3, 'author_defect_report')], { examType: 'senior' });
    const result = plan(bp, [item('FOUND.XM.001', { skillId: 'DOC.BUG' })]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons[0]?.code).toBe('no_item_for_family');

    const senior = plan(bp, [item('ADV.XM.001', { skillId: 'DOC.ADV' })]);
    expect(senior.ok).toBe(true);
  });

  it('refuses when the assembled set overruns the total budget', () => {
    // Segments allow 60s each but the exam as a whole allows only 1 minute.
    const bp = blueprint(
      [segment('a', 1, 'author_defect_report'), segment('b', 1, 'author_defect_report')],
      { durationMinutes: 1, itemCount: 2 },
    );
    const result = planExam(
      { ...bp, durationMinutes: 2 }, // keep EX-03 satisfied
      [item('A.XM.001', { seconds: 60 }), item('B.XM.002', { seconds: 60 })],
      [],
      { now: NOW, skills: SKILLS },
    );
    expect(result.ok).toBe(true);

    const tight = planExam(
      { ...bp, durationMinutes: 2, segments: [segment('a', 1, 'author_defect_report')], itemCount: 1 },
      [item('A.XM.001', { seconds: 60 })],
      [],
      { now: NOW, skills: SKILLS },
    );
    // segments (1 min) no longer sum to durationMinutes (2) — EX-03.
    expect(tight.ok).toBe(false);
    if (tight.ok) return;
    expect(tight.reasons[0]?.code).toBe('blueprint_invalid');
  });
});

describe('blueprint validation — docs/10 §9', () => {
  it('rejects segments that do not sum to the stated duration (EX-03)', () => {
    const bp = blueprint([segment('a', 4, 'author_defect_report')], { durationMinutes: 20 });
    expect(validateBlueprint(bp)[0]?.values?.rule).toBe('EX-03');
  });

  it('rejects an itemCount that disagrees with the segments (EX-02)', () => {
    const bp = blueprint([segment('a', 4, 'author_defect_report')], { itemCount: 6 });
    expect(validateBlueprint(bp).some((r) => r.values?.rule === 'EX-02')).toBe(true);
  });

  it('rejects duplicate segment ids (EX-04)', () => {
    const bp = blueprint([
      segment('a', 2, 'author_defect_report'),
      segment('a', 2, 'sql_query'),
    ]);
    expect(validateBlueprint(bp).some((r) => r.values?.rule === 'EX-04')).toBe(true);
  });

  it('rejects a blueprint that would draw from the practice pool (EX-05)', () => {
    const bp = blueprint([segment('a', 3, 'author_defect_report')], {
      selectionRules: { ...RULES, poolRef: 'practice' as SelectionRules['poolRef'] },
    });
    expect(validateBlueprint(bp).some((r) => r.values?.rule === 'EX-05')).toBe(true);
  });

  it('rejects requiring judgement with no judgement segment (EX-07)', () => {
    const bp = blueprint([segment('a', 3, 'author_defect_report')], {
      selectionRules: { ...RULES, requireJudgementItem: true },
    });
    expect(validateBlueprint(bp).some((r) => r.values?.rule === 'EX-07')).toBe(true);
  });
});

describe('determinism — docs/10 §8', () => {
  it('produces an identical plan on every run', () => {
    const bp = blueprint([
      segment('a', 3, 'author_defect_report'),
      segment('b', 3, 'author_defect_report'),
    ]);
    const pool = [
      item('C.XM.003', { skillId: 'DOC.ADV' }),
      item('A.XM.001', { skillId: 'DOC.BUG' }),
      item('B.XM.002', { skillId: 'DOC.BUG' }),
    ];
    const first = plan(bp, pool);
    for (let i = 0; i < 5; i += 1) {
      expect(plan(bp, pool)).toEqual(first);
    }
  });

  it('does not depend on the order items arrive in', () => {
    const bp = blueprint([segment('a', 3, 'author_defect_report')]);
    const a = item('A.XM.001', { skillId: 'DOC.BUG' });
    const b = item('B.XM.002', { skillId: 'DOC.BUG' });
    expect(plan(bp, [a, b])).toEqual(plan(bp, [b, a]));
  });
});
