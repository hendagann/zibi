import type { AttemptRecord } from '@/storage/attempts';
import type { ExamSession } from '@/storage/examSessions';
import type { PlannedSegment } from './types';

/**
 * Sitting logic — docs/10 §7.1 and §7.2, as pure functions.
 *
 * Everything here is derived from the frozen session plus the stored attempts.
 * Nothing about progress through an exam is stored a second time, so there is
 * no state that can disagree with the answers on disk.
 */

export interface SegmentState {
  readonly segment: PlannedSegment;
  readonly attempt: AttemptRecord | undefined;
  readonly answered: boolean;
}

export function segmentStates(
  session: ExamSession,
  attempts: readonly AttemptRecord[],
): SegmentState[] {
  return session.segments.map((segment) => {
    const attempt = attempts.find((a) => a.item_id === segment.itemId);
    return { segment, attempt, answered: attempt !== undefined };
  });
}

/** The segment the learner is on: the first one with no answer yet. */
export function currentSegment(
  session: ExamSession,
  attempts: readonly AttemptRecord[],
): PlannedSegment | null {
  return segmentStates(session, attempts).find((s) => !s.answered)?.segment ?? null;
}

export function answeredCount(
  session: ExamSession,
  attempts: readonly AttemptRecord[],
): number {
  return segmentStates(session, attempts).filter((s) => s.answered).length;
}

export function isComplete(
  session: ExamSession,
  attempts: readonly AttemptRecord[],
): boolean {
  return session.segments.length > 0 && currentSegment(session, attempts) === null;
}

export interface SegmentScore {
  readonly segmentId: string;
  readonly titleHe: string;
  readonly itemId: string;
  readonly score: number;
  readonly unevaluable: boolean;
}

export interface ExamResult {
  readonly sessionId: string;
  readonly perSegment: readonly SegmentScore[];
  readonly examScore: number;
  readonly passMark: number;
  readonly passed: boolean;
  readonly submittedAt: string;
  readonly scoredSegments: number;
}

/** docs/07 §5.2 — round once, half up. */
function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/**
 * The exam result — only once every segment has an answer (docs/10 §7.2).
 *
 * The mean is unweighted: each segment is one item and therefore one equal unit
 * of evidence. Weighting by a segment's minutes would turn a pacing instrument
 * into a scoring one, and §6 commits to the opposite. An unevaluable segment is
 * excluded rather than counted as zero — a broken item is our defect.
 */
export function computeExamResult(
  session: ExamSession,
  attempts: readonly AttemptRecord[],
): ExamResult | null {
  if (!isComplete(session, attempts)) return null;

  const states = segmentStates(session, attempts);
  const perSegment: SegmentScore[] = states.map(({ segment, attempt }) => ({
    segmentId: segment.segmentId,
    titleHe: segment.titleHe,
    itemId: segment.itemId,
    score: attempt?.evaluation.final_score ?? 0,
    unevaluable: attempt?.evaluation.unevaluable ?? false,
  }));

  const scored = perSegment.filter((s) => !s.unevaluable);
  const examScore =
    scored.length === 0
      ? 0
      : roundHalfUp(scored.reduce((sum, s) => sum + s.score, 0) / scored.length);

  const submittedAt = states
    .map((s) => s.attempt?.submitted_at ?? '')
    .filter(Boolean)
    .sort()
    .at(-1) as string;

  return {
    sessionId: session.session_id,
    perSegment,
    examScore,
    passMark: session.pass_mark,
    passed: examScore >= session.pass_mark,
    submittedAt,
    scoredSegments: scored.length,
  };
}
