import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DefectReportAnswer } from '@/content/blocks';
import type { SqlAnswer } from '@/content/exercise';
import type { EvaluationResult } from '@/scoring/types';

/**
 * Attempt storage — an append-only JSONL file.
 *
 * Append-only is a requirement, not an implementation shortcut: docs/06 §7
 * makes attempt records immutable, and the pass gate for this phase includes
 * "a repeat attempt does not erase the previous one". Nothing in this module
 * can overwrite or delete a record — there is no update function to misuse.
 *
 * `ZIBI_DATA_ROOT` exists for tests, exactly like `ZIBI_CONTENT_ROOT` in the
 * loader. The default lives outside git: attempts are user data, not content.
 */

function dataRoot(): string {
  return process.env.ZIBI_DATA_ROOT ?? join(process.cwd(), 'data');
}

function attemptsFile(): string {
  return join(dataRoot(), 'attempts.jsonl');
}

export interface AttemptRecord {
  readonly attempt_id: string;
  readonly user_id: string;
  readonly item_id: string;
  readonly item_version: number;
  readonly attempt_number: number;
  readonly submitted_at: string;
  /**
   * Where the attempt happened (docs/06 §9). Absent on records written before
   * exams existed, which are all practice by definition — readers must treat a
   * missing value as `practice` rather than as unknown.
   */
  readonly context?: 'practice' | 'exam';
  /** Set for `exam` attempts: the sitting this answer belongs to (docs/10 §7.1). */
  readonly session_id?: string;
  /** Raw as submitted, never normalised — re-scoring needs the original. */
  readonly answer: DefectReportAnswer | SqlAnswer;
  readonly evaluation: EvaluationResult;
}

export async function appendAttempt(record: AttemptRecord): Promise<void> {
  await mkdir(dataRoot(), { recursive: true });
  await appendFile(attemptsFile(), `${JSON.stringify(record)}\n`, 'utf8');
}

export async function readAttempts(): Promise<AttemptRecord[]> {
  let raw: string;
  try {
    raw = await readFile(attemptsFile(), 'utf8');
  } catch {
    return [];
  }
  return raw
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as AttemptRecord);
}

export async function attemptsForItem(
  userId: string,
  itemId: string,
): Promise<AttemptRecord[]> {
  const all = await readAttempts();
  return all
    .filter((a) => a.user_id === userId && a.item_id === itemId)
    .sort((a, b) => a.attempt_number - b.attempt_number);
}

export async function attemptsForUser(userId: string): Promise<AttemptRecord[]> {
  const all = await readAttempts();
  return all.filter((a) => a.user_id === userId);
}

/** Attempts belonging to one exam sitting, oldest first — docs/10 §7.1. */
export async function attemptsForSession(
  userId: string,
  sessionId: string,
): Promise<AttemptRecord[]> {
  const all = await readAttempts();
  return all
    .filter((a) => a.user_id === userId && a.session_id === sessionId)
    .sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at));
}

/**
 * The single-user id for this phase. Authentication is out of scope; the
 * storage schema carries user_id so that adding real users later is a data
 * migration of one constant, not a schema change.
 */
export const LOCAL_USER = 'local';
