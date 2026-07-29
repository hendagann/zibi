import type { ExperienceBand, Skill, SkillId, Tier } from '@/content/types';
import type { ExerciseItem } from '@/content/exercise';
import type { SkillProgress } from '@/progress/types';
import type { AttemptRecord } from '@/storage/attempts';
import type { ExamBlueprint, ExamPlan, PlannedSegment, RefusalReason } from './types';

/**
 * The exam planner — docs/10.
 *
 * One function plans all five exam types. They differ only in the blueprint
 * they execute and in how candidates are ORDERED; no exam type relaxes a
 * constraint, because an exam assembled by bending its own plan reports a
 * readiness figure for something it did not run (docs/10 §1).
 *
 * Pure and deterministic: a function of (blueprint, pool, attempts, now).
 * There is no random source anywhere — candidate order is fully decided by the
 * preference key and broken, finally, by item id, so the same history and the
 * same blueprint always produce the same exam and a test can assert the exact
 * item list (docs/10 §8).
 *
 * The planner does not know what a question family means. It matches
 * `segment.questionFamily` against `item.questionType` as data, so a new
 * family is a content change and never a change here (docs/10 §2.1).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** docs/05 §16: the band is derived from the primary skill's tier by default. */
const BAND_BY_TIER: Record<Tier, ExperienceBand> = {
  foundation: 'junior',
  applied: 'mid',
  advanced: 'senior',
};

const TIER_RANK: Record<Tier, number> = { foundation: 0, applied: 1, advanced: 2 };

export interface PlanOptions {
  /** Reference date for the no-repeat window. Passed in so tests are deterministic. */
  readonly now: Date;
  readonly skills: readonly Skill[];
  /** Per-skill progress, used ONLY to order candidates — docs/10 §3. */
  readonly progress?: readonly SkillProgress[];
}

interface Candidate {
  readonly item: ExerciseItem;
  readonly skillId: SkillId;
  readonly skill: Skill | undefined;
}

/**
 * A judgement item is one whose primary skill is where professional judgement
 * actually lives: docs/03 §8 puts that at `advanced` tier and `K4`.
 */
function isJudgement(skill: Skill | undefined): boolean {
  return skill?.tier === 'advanced' || skill?.cognitiveLevel === 'K4';
}

function bandOf(candidate: Candidate): ExperienceBand | undefined {
  if (candidate.item.experienceBand) return candidate.item.experienceBand;
  return candidate.skill ? BAND_BY_TIER[candidate.skill.tier] : undefined;
}

/** docs/10 §9 — a blueprint that does not describe a coherent plan cannot run. */
export function validateBlueprint(blueprint: ExamBlueprint): RefusalReason[] {
  const reasons: RefusalReason[] = [];
  const segments = blueprint.segments;

  if (segments.length === 0) {
    reasons.push({ code: 'blueprint_invalid', values: { rule: 'EX-02', segments: 0 } });
    return reasons;
  }
  if (blueprint.itemCount !== segments.length) {
    reasons.push({
      code: 'blueprint_invalid',
      values: { rule: 'EX-02', itemCount: blueprint.itemCount, segments: segments.length },
    });
  }
  const minutes = segments.reduce((sum, s) => sum + s.minutes, 0);
  if (minutes !== blueprint.durationMinutes) {
    reasons.push({
      code: 'blueprint_invalid',
      values: { rule: 'EX-03', segmentMinutes: minutes, durationMinutes: blueprint.durationMinutes },
    });
  }
  if (new Set(segments.map((s) => s.segmentId)).size !== segments.length) {
    reasons.push({ code: 'blueprint_invalid', values: { rule: 'EX-04' } });
  }
  if (blueprint.selectionRules.poolRef !== 'exam') {
    reasons.push({ code: 'blueprint_invalid', values: { rule: 'EX-05' } });
  }
  if (
    blueprint.selectionRules.requireJudgementItem &&
    !segments.some((s) => s.judgement)
  ) {
    reasons.push({ code: 'blueprint_invalid', values: { rule: 'EX-07' } });
  }
  return reasons;
}

/**
 * Ordering preference per exam type — docs/10 §5. Lower sorts first, and the
 * final tie-break is always the item id so the result is reproducible.
 */
function preferenceKey(
  candidate: Candidate,
  blueprint: ExamBlueprint,
  usedSkillCounts: ReadonlyMap<SkillId, number>,
  abilityBySkill: ReadonlyMap<SkillId, number>,
): readonly number[] {
  const [low, high] = blueprint.selectionRules.difficultyBand;
  const centre = (low + high) / 2;
  const difficulty = candidate.item.difficulty ?? centre;
  const distanceFromCentre = Math.abs(difficulty - centre);
  const alreadyUsed = usedSkillCounts.get(candidate.skillId) ?? 0;

  switch (blueprint.examType) {
    case 'weakness': {
      // Weakest first. A skill with no evidence is not a known weakness, so it
      // sorts after measured weak skills but before measured strong ones.
      const ability = abilityBySkill.get(candidate.skillId) ?? 60;
      return [ability, alreadyUsed, distanceFromCentre];
    }
    case 'senior':
      // Hardest and highest tier first.
      return [
        -(candidate.skill ? TIER_RANK[candidate.skill.tier] : 0),
        -difficulty,
        alreadyUsed,
      ];
    case 'readiness':
    case 'random':
      // Spread across skills before anything else, so one skill cannot fill
      // several segments while another goes unmeasured.
      return [alreadyUsed, distanceFromCentre, difficulty];
    case 'topic':
      return [distanceFromCentre, alreadyUsed, difficulty];
  }
}

function compareKeys(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function planExam(
  blueprint: ExamBlueprint,
  pool: readonly ExerciseItem[],
  attempts: readonly AttemptRecord[],
  options: PlanOptions,
): ExamPlan {
  const invalid = validateBlueprint(blueprint);
  if (invalid.length > 0) {
    return { ok: false, blueprintId: blueprint.id, examType: blueprint.examType, reasons: invalid };
  }

  const rules = blueprint.selectionRules;
  const skillById = new Map(options.skills.map((s) => [s.id, s]));
  const abilityBySkill = new Map(
    (options.progress ?? []).map((p) => [p.skillId, p.needsReview ? p.ability - 100 : p.ability]),
  );

  /* ---- eligibility, before any per-segment matching (docs/10 §3) ---- */

  const inScope = pool
    .filter((item) => item.type === 'exam_item' && item.pool === rules.poolRef)
    .filter((item) => !blueprint.scopeRef || item.topic === blueprint.scopeRef)
    .map<Candidate>((item) => {
      const skillId = item.skills?.primary ?? '';
      return { item, skillId, skill: skillById.get(skillId) };
    })
    .filter((c) => {
      const [low, high] = rules.difficultyBand;
      const difficulty = c.item.difficulty;
      if (typeof difficulty === 'number' && (difficulty < low || difficulty > high)) return false;
      if (rules.experienceBand && bandOf(c) !== rules.experienceBand) return false;
      // A senior exam measures judgement by definition, so a foundation item
      // cannot appear in one however well it fits the time budget.
      if (blueprint.examType === 'senior' && !isJudgement(c.skill)) return false;
      return true;
    });

  /**
   * Items the learner has already met.
   *
   * `excludeAttempted` covers docs/10 §3.2 outright: an item attempted at all,
   * in any context, is out. The narrower `noRepeatWithinDays` window of §3.3
   * applies to EXAM sittings specifically — practising an item is governed by
   * §3.2, while re-seeing it in an exam is what the window is about. An attempt
   * with no `context` predates exams and is practice by definition.
   */
  const cutoff = options.now.getTime() - rules.noRepeatWithinDays * DAY_MS;
  const seen = new Set(
    attempts
      .filter(
        (a) =>
          rules.excludeAttempted ||
          ((a.context ?? 'practice') === 'exam' && Date.parse(a.submitted_at) >= cutoff),
      )
      .map((a) => a.item_id),
  );

  /* ---- fill each segment in order ---- */

  const planned: PlannedSegment[] = [];
  const reasons: RefusalReason[] = [];
  const usedItems = new Set<string>();
  const usedSkillCounts = new Map<SkillId, number>();

  for (const segment of blueprint.segments) {
    const family = inScope.filter((c) => c.item.questionType === segment.questionFamily);

    if (family.length === 0) {
      reasons.push({
        code: 'no_item_for_family',
        segmentId: segment.segmentId,
        values: { questionFamily: segment.questionFamily, found: 0 },
      });
      continue;
    }

    const fresh = family.filter((c) => !seen.has(c.item.id) && !usedItems.has(c.item.id));
    if (fresh.length === 0) {
      reasons.push({
        code: 'all_candidates_seen',
        segmentId: segment.segmentId,
        values: { questionFamily: segment.questionFamily, found: family.length },
      });
      continue;
    }

    const budgetSeconds = segment.minutes * 60;
    const affordable = fresh.filter(
      (c) =>
        c.item.estimatedSeconds <= budgetSeconds &&
        (usedSkillCounts.get(c.skillId) ?? 0) < rules.maxItemsPerSkill,
    );
    if (affordable.length === 0) {
      const shortest = Math.min(...fresh.map((c) => c.item.estimatedSeconds));
      reasons.push({
        code: 'segment_over_budget',
        segmentId: segment.segmentId,
        values: { budgetSeconds, shortestCandidateSeconds: shortest },
      });
      continue;
    }

    const chosen = [...affordable].sort((a, b) => {
      const byPreference = compareKeys(
        preferenceKey(a, blueprint, usedSkillCounts, abilityBySkill),
        preferenceKey(b, blueprint, usedSkillCounts, abilityBySkill),
      );
      if (byPreference !== 0) return byPreference;
      // Prefer the segment's hinted skill, then fall back to the id so the
      // choice is never left to array order.
      const hintA = a.skillId === segment.skillHint ? 0 : 1;
      const hintB = b.skillId === segment.skillHint ? 0 : 1;
      return hintA - hintB || a.item.id.localeCompare(b.item.id);
    })[0] as Candidate;

    usedItems.add(chosen.item.id);
    usedSkillCounts.set(chosen.skillId, (usedSkillCounts.get(chosen.skillId) ?? 0) + 1);
    planned.push({
      segmentId: segment.segmentId,
      titleHe: segment.titleHe,
      minutes: segment.minutes,
      itemId: chosen.item.id,
      questionFamily: segment.questionFamily,
      skillId: chosen.skillId,
      estimatedSeconds: chosen.item.estimatedSeconds,
      open: segment.open,
      judgement: segment.judgement && isJudgement(chosen.skill),
    });
  }

  /* ---- whole-exam constraints (docs/10 §3, §4) ---- */

  const totalSeconds = planned.reduce((sum, p) => sum + p.estimatedSeconds, 0);
  const totalBudget = blueprint.durationMinutes * 60;
  if (totalSeconds > totalBudget) {
    reasons.push({
      code: 'over_total_budget',
      values: { totalSeconds, budgetSeconds: totalBudget },
    });
  }

  const openCount = planned.filter((p) => p.open).length;
  if (openCount < rules.minOpenQuestions) {
    reasons.push({
      code: 'too_few_open_questions',
      values: { required: rules.minOpenQuestions, found: openCount },
    });
  }

  if (rules.requireJudgementItem && !planned.some((p) => p.judgement)) {
    reasons.push({ code: 'no_judgement_item', values: { found: 0 } });
  }

  if (reasons.length > 0 || planned.length !== blueprint.segments.length) {
    return { ok: false, blueprintId: blueprint.id, examType: blueprint.examType, reasons };
  }

  return {
    ok: true,
    blueprintId: blueprint.id,
    examType: blueprint.examType,
    segments: planned,
    totalSeconds,
    durationMinutes: blueprint.durationMinutes,
    openCount,
  };
}

/** Convenience for surfaces that only need to know whether an exam can run. */
export function isRunnable(plan: ExamPlan): boolean {
  return plan.ok;
}
