import type { Dimension } from '@/scoring/types';

/** Dimensions as reported — docs/09 §2. `null` means no evidence, never 0. */
export interface DimensionScores {
  readonly knowledge: number | null;
  readonly application: number | null;
  readonly reasoning: number | null;
  readonly speed: number | null;
  readonly stability: number | null;
}

export type TrendDirection = 'improving' | 'declining' | 'steady';
export type StabilityLevel = 'high' | 'medium' | 'low';
export type ProgressConfidence = 'high' | 'medium' | 'low';

export interface RecurringError {
  readonly label: string;
  readonly occurrences: number;
  /** Where to revise it, taken from the criterion that reported it. */
  readonly remediation: { readonly ref: string; readonly anchor?: string } | null;
}

export interface ReviewReason {
  readonly code:
    | 'latest_below_pass'
    | 'declining'
    | 'unstable'
    | 'recurring_error'
    | 'stale'
    | 'repeats_only';
  /**
   * Language-neutral values for the UI to interpolate. The Hebrew wording lives
   * in `src/i18n` (CM-20), so the computation stays a pure function with no
   * interface strings baked into it. `label` (a recurring error's text) comes
   * from content data, not from a literal in `src`.
   */
  readonly values?: Readonly<Record<string, string | number>>;
}

export interface SkillProgress {
  readonly skillId: string;
  readonly topicId: string | null;

  /* the ten stored measures — docs/09 §5 */
  readonly attempts: number;
  readonly latest: number;
  readonly mean: number;
  readonly best: number;
  readonly successRate: number;
  readonly medianTimeSeconds: number | null;
  readonly recurringErrors: readonly RecurringError[];
  readonly lastPractisedAt: string;
  readonly confidence: ProgressConfidence;
  readonly needsReview: boolean;
  readonly reviewReasons: readonly ReviewReason[];

  /* the state signals a mean cannot express — docs/09 §4 */
  readonly ability: number;
  readonly trendSlope: number | null;
  readonly trend: TrendDirection | null;
  readonly stabilityRange: number | null;
  /** Spread around the fitted trend — what `stabilityLevel` is derived from. */
  readonly stabilityResidual: number | null;
  readonly stabilityLevel: StabilityLevel | null;
  readonly freshItems: number;
  readonly freshFirstAttemptRate: number | null;

  readonly dimensions: DimensionScores;
  readonly distinctItems: number;
}

export interface TopicProgress {
  readonly topicId: string;
  readonly skills: readonly SkillProgress[];
  readonly ability: number;
  readonly dimensions: DimensionScores;
  readonly attempts: number;
  readonly needsReview: boolean;
}

export interface OverallProgress {
  readonly topics: readonly TopicProgress[];
  readonly skills: readonly SkillProgress[];
  readonly ability: number | null;
  readonly dimensions: DimensionScores;
  readonly totalAttempts: number;
  readonly skillsNeedingReview: number;
}

export type { Dimension };
