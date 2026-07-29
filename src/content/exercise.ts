import type { Block, DefectReportAnswer } from './blocks';
import type { ContentItem } from './types';

/** Assessment fields an exercise or exam item adds to the envelope — docs/06 §6. */
export interface ExerciseItem extends ContentItem {
  readonly questionType: 'author_defect_report' | 'repair_defect_report';
  readonly requiresEvidence: boolean;
  readonly rubricRef: string;
  readonly scenario: readonly Block[];
  readonly prompt: readonly Block[];
  readonly modelAnswer: DefectReportAnswer;
  readonly revisionRefs: readonly string[];
  readonly diagnosisOptions?: readonly { readonly id: string; readonly label: string }[];
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
