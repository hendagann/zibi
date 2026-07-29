import type { ContentItemId, ExperienceBand, SkillId, TopicId } from '@/content/types';

/**
 * Exam blueprint and plan types — docs/10.
 *
 * A blueprint is authored data (docs/05 §13). A plan is what the planner
 * produces from it, and it is either a complete assembled exam or an explicit
 * refusal — never a partially filled exam (docs/06 §11 rule 5).
 */

export type ExamType = 'topic' | 'random' | 'weakness' | 'senior' | 'readiness';

export interface BlueprintSegment {
  readonly segmentId: string;
  /** Display name, authored — the planner never invents Hebrew (CM-20). */
  readonly titleHe: string;
  readonly minutes: number;
  /** Matched against an item's `questionType`, as data — docs/10 §2.1. */
  readonly questionFamily: string;
  readonly open: boolean;
  readonly judgement: boolean;
  readonly skillHint?: SkillId;
}

export interface SelectionRules {
  readonly poolRef: 'exam';
  readonly noRepeatWithinDays: number;
  readonly excludeAttempted: boolean;
  readonly minOpenQuestions: number;
  readonly requireJudgementItem: boolean;
  readonly maxItemsPerSkill: number;
  readonly difficultyBand: readonly [number, number];
  readonly experienceBand: ExperienceBand | null;
}

export interface ExamBlueprint {
  readonly id: ContentItemId;
  readonly type: 'exam_blueprint';
  readonly examType: ExamType;
  readonly scope: 'topic' | 'domain' | 'full';
  readonly scopeRef?: TopicId;
  readonly title: string;
  readonly durationMinutes: number;
  readonly passMark: number;
  readonly itemCount: number;
  readonly segments: readonly BlueprintSegment[];
  readonly skillWeights?: Readonly<Record<SkillId, number>>;
  readonly selectionRules: SelectionRules;
}

export interface PlannedSegment {
  readonly segmentId: string;
  readonly titleHe: string;
  readonly minutes: number;
  readonly itemId: ContentItemId;
  readonly questionFamily: string;
  readonly skillId: SkillId;
  readonly estimatedSeconds: number;
  readonly open: boolean;
  readonly judgement: boolean;
}

/** Why an exam could not be assembled — docs/10 §4. */
export type RefusalCode =
  | 'no_item_for_family'
  | 'all_candidates_seen'
  | 'segment_over_budget'
  | 'over_total_budget'
  | 'too_few_open_questions'
  | 'no_judgement_item'
  | 'blueprint_invalid';

export interface RefusalReason {
  readonly code: RefusalCode;
  readonly segmentId?: string;
  /** Language-neutral detail for the UI to interpolate (CM-20). */
  readonly values?: Readonly<Record<string, string | number>>;
}

export type ExamPlan =
  | {
      readonly ok: true;
      readonly blueprintId: ContentItemId;
      readonly examType: ExamType;
      readonly segments: readonly PlannedSegment[];
      readonly totalSeconds: number;
      readonly durationMinutes: number;
      readonly openCount: number;
    }
  | {
      readonly ok: false;
      readonly blueprintId: ContentItemId;
      readonly examType: ExamType;
      readonly reasons: readonly RefusalReason[];
    };
