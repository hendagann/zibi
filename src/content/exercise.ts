import type { SqlSpec } from '@/scoring/sqlEngine';
import type { Block, DefectReportAnswer } from './blocks';
import type { ContentItem } from './types';

/** The answer shape for sql_query exercises. */
export interface SqlAnswer {
  readonly sql: string;
}

/**
 * A common mistake declared on a SCORED item — docs/06 §6.3.
 *
 * Deliberately a different type from the guided example's illustrative
 * `commonMistakes` (docs/05 §12): every field is required here, because
 * feedback is generated from it. `whyTempting` is required for the reason
 * docs/06 gives — naming an error teaches less than explaining why the wrong
 * answer was attractive.
 */
export interface ItemCommonMistake {
  readonly misconceptionId: string;
  readonly descriptionHe: string;
  readonly whyTempting: string;
  readonly remediationRef: string;
  readonly anchor?: string;
}

/** Assessment fields an exercise or exam item adds to the envelope — docs/06 §6. */
export interface ExerciseItem extends ContentItem {
  readonly questionType: 'author_defect_report' | 'repair_defect_report' | 'sql_query';
  readonly requiresEvidence: boolean;
  readonly rubricRef: string;
  readonly scenario: readonly Block[];
  readonly prompt: readonly Block[];
  readonly modelAnswer: DefectReportAnswer | SqlAnswer;
  readonly revisionRefs: readonly string[];
  /** docs/06 §6.3 — assessment metadata, validated by QM-07 and QM-16. */
  readonly commonMistakes?: readonly ItemCommonMistake[];
  readonly diagnosisOptions?: readonly { readonly id: string; readonly label: string }[];
  /** sql_query only. */
  readonly sqlSpec?: SqlSpec;
}

export interface SummaryItem extends ContentItem {
  readonly body: readonly Block[];
  readonly keyPoints: readonly string[];
}

export interface LessonItem extends ContentItem {
  readonly body: readonly Block[];
  readonly teachesSkills: readonly string[];
  readonly guidedExamples: readonly string[];
}

export interface GuidedExampleItem extends ContentItem {
  readonly lesson: string;
  readonly scenario: readonly Block[];
  readonly steps: readonly { readonly action: string; readonly reasoning: string }[];
  readonly outcome: readonly Block[];
  readonly commonMistakes?: readonly { readonly mistake: string; readonly whyTempting: string }[];
}

export function isExercise(item: ContentItem): item is ExerciseItem {
  return item.type === 'exercise' || item.type === 'exam_item';
}

export function isSqlAnswer(
  answer: DefectReportAnswer | SqlAnswer,
): answer is SqlAnswer {
  return typeof (answer as SqlAnswer).sql === 'string';
}
