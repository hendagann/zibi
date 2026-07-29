import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExamType, PlannedSegment } from '@/exam/types';

/**
 * Exam sessions — an append-only JSONL file, alongside the attempt log.
 *
 * A session exists to FREEZE a plan (docs/10 §7.1). The planner excludes items
 * the learner has already attempted, so re-planning after the first answer
 * would legitimately choose a different item for a later segment — and a plan
 * recomputed mid-exam is not a fixed plan. Freezing it is what makes two
 * sittings of one blueprint comparable.
 *
 * Records are written once and never updated. There is deliberately no
 * "submitted" event: completion is derived from the stored attempts (§7.1), so
 * there is no second source of truth to fall out of step with the answers.
 *
 * Sessions are learner data, so they live under the same gitignored data root
 * as attempts — never in `content/`.
 */

function dataRoot(): string {
  return process.env.ZIBI_DATA_ROOT ?? join(process.cwd(), 'data');
}

function sessionsFile(): string {
  return join(dataRoot(), 'exam-sessions.jsonl');
}

export interface ExamSession {
  readonly session_id: string;
  readonly user_id: string;
  readonly blueprint_id: string;
  readonly exam_type: ExamType;
  readonly title: string;
  readonly started_at: string;
  readonly duration_minutes: number;
  readonly pass_mark: number;
  /** The frozen plan, in order. */
  readonly segments: readonly PlannedSegment[];
}

export async function appendSession(session: ExamSession): Promise<void> {
  await mkdir(dataRoot(), { recursive: true });
  await appendFile(sessionsFile(), `${JSON.stringify(session)}\n`, 'utf8');
}

export async function readSessions(): Promise<ExamSession[]> {
  let raw: string;
  try {
    raw = await readFile(sessionsFile(), 'utf8');
  } catch {
    return [];
  }
  return raw
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as ExamSession);
}

export async function getSession(
  userId: string,
  sessionId: string,
): Promise<ExamSession | null> {
  const all = await readSessions();
  return all.find((s) => s.user_id === userId && s.session_id === sessionId) ?? null;
}

export async function sessionsForUser(userId: string): Promise<ExamSession[]> {
  const all = await readSessions();
  return all
    .filter((s) => s.user_id === userId)
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
}
