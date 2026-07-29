import type { AttemptRecord } from '@/storage/attempts';
import type { CriterionResult, Dimension } from '@/scoring/types';
import type {
  DimensionScores,
  OverallProgress,
  ProgressConfidence,
  RecurringError,
  ReviewReason,
  SkillProgress,
  StabilityLevel,
  TopicProgress,
  TrendDirection,
} from './types';

/**
 * Progress computation — docs/09, implemented as pure functions.
 *
 * The whole module is deterministic: it takes the attempt log and a reference
 * date, and returns the same result every time. Nothing is cached, nothing is
 * stored separately, and the clock is a parameter rather than a hidden input
 * (docs/09 §10).
 *
 * The central commitment is that no figure here is a plain mean. A mean cannot
 * distinguish 40→60→90 from 90→60→40, and those two learners need opposite
 * advice.
 */

/* ---------------- tuning constants — docs/09 §3, Q-09-1 ---------------- */

/** Recency decay per attempt going backwards. 1.0 would be a plain mean. */
export const RECENCY_DECAY = 0.7;
/** Weight of a repeat of an already-attempted item, versus 1.0 for a first try. */
export const REPEAT_WEIGHT = 0.4;
/** Score at or above which an attempt counts as a success. */
export const PASS_THRESHOLD = 70;
/** Attempts considered by trend and stability. */
export const RECENT_WINDOW = 5;
/** Days after which a skill is considered stale. */
export const STALE_DAYS = 21;

/* ---------------- small helpers ---------------- */

const round1 = (n: number) => Math.round(n * 10) / 10;

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

function daysBetween(from: string, to: Date): number {
  const ms = to.getTime() - new Date(from).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

/* ---------------- weighting — docs/09 §3 ---------------- */

interface WeightedAttempt {
  readonly attempt: AttemptRecord;
  readonly score: number;
  readonly weight: number;
  readonly isFirstEverForItem: boolean;
}

/**
 * Attempts oldest→newest, each with `recency × novelty`.
 *
 * Recency is why order matters at all. Novelty is docs/07 §18: after an
 * attempt the learner has been told, criterion by criterion, exactly what was
 * missing — so scoring well on that same item again is partly recall of the
 * feedback, and must not count like solving something cold.
 */
export function weightAttempts(
  attempts: readonly AttemptRecord[],
  scoreOf: (attempt: AttemptRecord) => number,
): WeightedAttempt[] {
  const ordered = [...attempts].sort(
    (a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at),
  );
  const seenItems = new Set<string>();
  const withNovelty = ordered.map((attempt) => {
    const isFirstEverForItem = !seenItems.has(attempt.item_id);
    seenItems.add(attempt.item_id);
    return { attempt, isFirstEverForItem };
  });

  const newestIndex = withNovelty.length - 1;
  return withNovelty.map(({ attempt, isFirstEverForItem }, index) => ({
    attempt,
    score: scoreOf(attempt),
    isFirstEverForItem,
    weight:
      RECENCY_DECAY ** (newestIndex - index) *
      (isFirstEverForItem ? 1 : REPEAT_WEIGHT),
  }));
}

function weightedMean(weighted: readonly WeightedAttempt[]): number {
  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  if (totalWeight === 0) return 0;
  return weighted.reduce((s, w) => s + w.score * w.weight, 0) / totalWeight;
}

/* ---------------- state signals — docs/09 §4 ---------------- */

/** Least-squares slope in points per attempt over the recent window. */
export function computeTrendSlope(scores: readonly number[]): number | null {
  const recent = scores.slice(-RECENT_WINDOW);
  if (recent.length < 3) return null;
  const n = recent.length;
  const meanX = (n - 1) / 2;
  const meanY = recent.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  recent.forEach((y, x) => {
    num += (x - meanX) * (y - meanY);
    den += (x - meanX) ** 2;
  });
  return den === 0 ? 0 : round1(num / den);
}

export function trendFromSlope(slope: number | null): TrendDirection | null {
  if (slope === null) return null;
  if (slope >= 5) return 'improving';
  if (slope <= -5) return 'declining';
  return 'steady';
}

/**
 * Stability = how *unexplained* the variation is, measured as the spread of
 * residuals around the fitted trend line.
 *
 * The raw range cannot do this job. 40→60→90 and 90→40→90 both span 50 points,
 * but the first is a learner improving steadily and the second is a coin flip.
 * Removing the trend first separates them: the improving learner's residuals
 * are tiny (predictable), the erratic learner's are enormous (not).
 *
 * `range` is kept alongside for display; `level` comes from `residualRange`.
 */
export function computeStability(
  scores: readonly number[],
): { range: number; residualRange: number; level: StabilityLevel } | null {
  const recent = scores.slice(-RECENT_WINDOW);
  if (recent.length < 2) return null;
  const range = Math.max(...recent) - Math.min(...recent);

  let residualRange = range;
  if (recent.length >= 3) {
    const n = recent.length;
    const meanX = (n - 1) / 2;
    const meanY = recent.reduce((s, v) => s + v, 0) / n;
    let num = 0;
    let den = 0;
    recent.forEach((y, x) => {
      num += (x - meanX) * (y - meanY);
      den += (x - meanX) ** 2;
    });
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;
    const residuals = recent.map((y, x) => y - (slope * x + intercept));
    residualRange = round1(Math.max(...residuals) - Math.min(...residuals));
  }

  const level: StabilityLevel =
    residualRange <= 10 ? 'high' : residualRange <= 25 ? 'medium' : 'low';
  return { range, residualRange, level };
}

/* ---------------- speed — docs/09 §7 ---------------- */

export function speedScoreFromRatio(ratio: number): number {
  if (ratio <= 1) return 100;
  if (ratio >= 3) return 0;
  return Math.round(100 - (ratio - 1) * 50);
}

/* ---------------- per-skill ---------------- */

interface ComputeOptions {
  /** Reference date for staleness. Passed in so tests are deterministic. */
  readonly now: Date;
  /** `estimatedSeconds` per item id, for the speed dimension. */
  readonly estimatedSecondsByItem?: Readonly<Record<string, number>>;
  /** Topic per skill id, for grouping. */
  readonly topicBySkill?: Readonly<Record<string, string>>;
}

function criteriaForSkill(attempt: AttemptRecord, skillId: string): CriterionResult[] {
  return attempt.evaluation.criterion_results.filter((c) =>
    c.skill_ids.includes(skillId),
  );
}

/** Per-skill score of one attempt: the fraction of that skill's criteria earned. */
function skillScoreOf(attempt: AttemptRecord, skillId: string): number {
  const stored = attempt.evaluation.per_skill_scores[skillId];
  if (typeof stored === 'number') return Math.round(stored * 100);
  const criteria = criteriaForSkill(attempt, skillId);
  const max = criteria.reduce((s, c) => s + c.max_points, 0);
  if (max === 0) return attempt.evaluation.final_score;
  return Math.round(
    (criteria.reduce((s, c) => s + c.awarded_points, 0) / max) * 100,
  );
}

function dimensionScore(
  weighted: readonly WeightedAttempt[],
  skillId: string,
  dimension: Dimension,
): number | null {
  let weightSum = 0;
  let valueSum = 0;
  for (const { attempt, weight } of weighted) {
    const criteria = criteriaForSkill(attempt, skillId).filter(
      (c) => c.dimension === dimension,
    );
    const max = criteria.reduce((s, c) => s + c.max_points, 0);
    if (max === 0) continue;
    const share = criteria.reduce((s, c) => s + c.awarded_points, 0) / max;
    valueSum += share * 100 * weight;
    weightSum += weight;
  }
  return weightSum === 0 ? null : Math.round(valueSum / weightSum);
}

function recurringErrorsOf(
  attempts: readonly AttemptRecord[],
  skillId: string,
): RecurringError[] {
  const counts = new Map<string, { count: number; remediation: RecurringError['remediation'] }>();
  for (const attempt of attempts) {
    // Count each label once per attempt: three attempts each missing the same
    // component is recurring; one attempt listing it three times is not.
    const seenHere = new Set<string>();
    for (const criterion of criteriaForSkill(attempt, skillId)) {
      for (const label of [...criterion.missing_elements, ...criterion.errors]) {
        if (seenHere.has(label)) continue;
        seenHere.add(label);
        const existing = counts.get(label);
        counts.set(label, {
          count: (existing?.count ?? 0) + 1,
          remediation: existing?.remediation ?? criterion.remediation ?? null,
        });
      }
    }
  }
  return [...counts.entries()]
    .filter(([, v]) => v.count >= 2)
    .map(([label, v]) => ({ label, occurrences: v.count, remediation: v.remediation }))
    .sort((a, b) => b.occurrences - a.occurrences);
}

export function computeSkillProgress(
  skillId: string,
  attempts: readonly AttemptRecord[],
  options: ComputeOptions,
): SkillProgress | null {
  const evaluable = attempts.filter(
    (a) => !a.evaluation.unevaluable && a.evaluation.skills_measured.includes(skillId),
  );
  if (evaluable.length === 0) return null;

  const weighted = weightAttempts(evaluable, (a) => skillScoreOf(a, skillId));
  const scores = weighted.map((w) => w.score);
  const latest = scores[scores.length - 1] as number;

  const stability = computeStability(scores);
  const slope = computeTrendSlope(scores);
  const trend = trendFromSlope(slope);

  /* speed: median ratio over attempts that recorded a duration */
  const ratios: number[] = [];
  for (const { attempt } of weighted) {
    const seconds = attempt.evaluation.time_spent_seconds;
    const estimate = options.estimatedSecondsByItem?.[attempt.item_id];
    if (typeof seconds === 'number' && typeof estimate === 'number' && estimate > 0) {
      ratios.push(seconds / estimate);
    }
  }
  const medianRatio = median(ratios);
  const speed = medianRatio === null ? null : speedScoreFromRatio(medianRatio);

  const durations = weighted
    .map((w) => w.attempt.evaluation.time_spent_seconds)
    .filter((s): s is number => typeof s === 'number');

  /* first-attempt success on items never attempted before — docs/09 §4.4 */
  const freshAttempts = weighted.filter((w) => w.isFirstEverForItem);
  const freshFirstAttemptRate =
    freshAttempts.length === 0
      ? null
      : freshAttempts.filter((w) => w.score >= PASS_THRESHOLD).length /
        freshAttempts.length;

  const distinctItems = new Set(evaluable.map((a) => a.item_id)).size;
  const lastPractisedAt = weighted[weighted.length - 1]!.attempt.submitted_at;
  const daysSince = daysBetween(lastPractisedAt, options.now);

  const ability = Math.round(weightedMean(weighted));
  const recurringErrors = recurringErrorsOf(evaluable, skillId);

  /* confidence — docs/09 §8 */
  let confidence: ProgressConfidence = 'low';
  if (evaluable.length >= 2) confidence = 'medium';
  if (
    evaluable.length >= 3 &&
    distinctItems >= 2 &&
    daysSince <= STALE_DAYS &&
    stability?.level !== 'low'
  ) {
    confidence = 'high';
  }

  /* needs review — docs/09 §6 */
  const reviewReasons: ReviewReason[] = [];
  if (latest < PASS_THRESHOLD) {
    reviewReasons.push({
      code: 'latest_below_pass',
      values: { latest, threshold: PASS_THRESHOLD },
    });
  }
  if (trend === 'declining') {
    reviewReasons.push({ code: 'declining', values: { slope: slope ?? 0 } });
  }
  if (stability?.level === 'low') {
    reviewReasons.push({
      code: 'unstable',
      values: { residual: stability.residualRange },
    });
  }
  if (recurringErrors.length > 0) {
    reviewReasons.push({
      code: 'recurring_error',
      values: {
        label: recurringErrors[0]!.label,
        occurrences: recurringErrors[0]!.occurrences,
      },
    });
  }
  if (daysSince > STALE_DAYS) {
    reviewReasons.push({ code: 'stale', values: { days: Math.floor(daysSince) } });
  }
  if (
    ability >= PASS_THRESHOLD &&
    freshFirstAttemptRate !== null &&
    freshFirstAttemptRate < 0.5
  ) {
    reviewReasons.push({ code: 'repeats_only' });
  }

  return {
    skillId,
    topicId: options.topicBySkill?.[skillId] ?? null,
    attempts: evaluable.length,
    latest,
    mean: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    best: Math.max(...scores),
    successRate:
      scores.filter((s) => s >= PASS_THRESHOLD).length / scores.length,
    medianTimeSeconds: median(durations),
    recurringErrors,
    lastPractisedAt,
    confidence,
    needsReview: reviewReasons.length > 0,
    reviewReasons,
    ability,
    trendSlope: slope,
    trend,
    stabilityRange: stability?.range ?? null,
    stabilityResidual: stability?.residualRange ?? null,
    stabilityLevel: stability?.level ?? null,
    freshItems: freshAttempts.length,
    freshFirstAttemptRate,
    dimensions: {
      knowledge: dimensionScore(weighted, skillId, 'knowledge'),
      application: dimensionScore(weighted, skillId, 'application'),
      reasoning: dimensionScore(weighted, skillId, 'reasoning'),
      speed,
      stability:
        stability === null ? null : Math.max(0, Math.round(100 - stability.residualRange * 2)),
    },
    distinctItems,
  };
}

/* ---------------- aggregation — docs/09 §9 ---------------- */

function aggregateDimensions(
  skills: readonly SkillProgress[],
): DimensionScores {
  const keys = ['knowledge', 'application', 'reasoning', 'speed', 'stability'] as const;
  const out = {} as Record<(typeof keys)[number], number | null>;
  for (const key of keys) {
    let weight = 0;
    let sum = 0;
    for (const skill of skills) {
      const value = skill.dimensions[key];
      if (value === null) continue;
      sum += value * skill.attempts;
      weight += skill.attempts;
    }
    out[key] = weight === 0 ? null : Math.round(sum / weight);
  }
  return out as DimensionScores;
}

function weightedAbility(skills: readonly SkillProgress[]): number {
  const weight = skills.reduce((s, k) => s + k.attempts, 0);
  if (weight === 0) return 0;
  return Math.round(
    skills.reduce((s, k) => s + k.ability * k.attempts, 0) / weight,
  );
}

export function computeProgress(
  attempts: readonly AttemptRecord[],
  skillIds: readonly string[],
  options: ComputeOptions,
): OverallProgress {
  const skills = skillIds
    .map((skillId) => computeSkillProgress(skillId, attempts, options))
    .filter((s): s is SkillProgress => s !== null);

  // Skills always carry a topic in the product; this sentinel only groups the
  // defensive null case (a skill id with no topic mapping). It is deliberately
  // not Hebrew, so it never crosses the content boundary (CM-20).
  const NO_TOPIC = '__no_topic__';
  const byTopic = new Map<string, SkillProgress[]>();
  for (const skill of skills) {
    const topicId = skill.topicId ?? NO_TOPIC;
    byTopic.set(topicId, [...(byTopic.get(topicId) ?? []), skill]);
  }

  const topics: TopicProgress[] = [...byTopic.entries()].map(([topicId, topicSkills]) => ({
    topicId,
    skills: topicSkills,
    ability: weightedAbility(topicSkills),
    dimensions: aggregateDimensions(topicSkills),
    attempts: topicSkills.reduce((s, k) => s + k.attempts, 0),
    needsReview: topicSkills.some((k) => k.needsReview),
  }));

  return {
    topics,
    skills,
    ability: skills.length === 0 ? null : weightedAbility(skills),
    dimensions: aggregateDimensions(skills),
    totalAttempts: attempts.filter((a) => !a.evaluation.unevaluable).length,
    skillsNeedingReview: skills.filter((s) => s.needsReview).length,
  };
}
