'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { DefectReportAnswer } from '@/content/blocks';
import { isExercise } from '@/content/exercise';
import { getActiveRubric, getDataset, getItem } from '@/content/loader';
import { evaluate } from '@/scoring/engine';
import { evaluateSql } from '@/scoring/sqlEngine';
import type { EvaluationResult } from '@/scoring/types';
import { executeSql } from '@/sql/executor';
import {
  appendAttempt,
  attemptsForItem,
  LOCAL_USER,
} from '@/storage/attempts';
import { approveItem, publishItem, saveItemEdit } from '@/storage/contentWriter';
import { t } from '@/i18n';

/**
 * The client reports elapsed time since the form mounted. A learner who opens
 * an exercise and comes back tomorrow would otherwise record a duration that
 * says nothing about their speed, so implausible values are dropped rather
 * than stored — docs/09 §7 then takes a median over what remains.
 */
function sanitiseDuration(seconds: number | undefined): number | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null;
  const rounded = Math.round(seconds);
  if (rounded < 1 || rounded > 2 * 60 * 60) return null;
  return rounded;
}

export interface SubmitResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly evaluation?: EvaluationResult;
}

/**
 * Submit an answer: evaluate against the item's active rubric, append the
 * attempt, and return the evaluation. The score is decided and persisted
 * here, before anything renders feedback — the one-way boundary of docs/08 §1.
 */
export async function submitAnswer(
  itemId: string,
  answer: DefectReportAnswer,
  timeSpentSeconds?: number,
): Promise<SubmitResult> {
  const item = await getItem(itemId);
  if (!item || !isExercise(item)) {
    return { ok: false, error: 'exercise-not-found' };
  }
  if (item.pool !== 'practice') {
    // Exam items give no feedback until an exam ends (docs/05 §14); the exam
    // flow is a later phase, so they are not submittable here at all.
    return { ok: false, error: 'not-practicable' };
  }

  const rubric = await getActiveRubric(item.rubricRef);

  const previous = await attemptsForItem(LOCAL_USER, itemId);
  const attemptId = randomUUID();
  const submittedAt = new Date().toISOString();

  const evaluation = evaluate({
    answer,
    // A missing rubric is represented as an inactive one so the engine takes
    // its unevaluable path (docs/07 §16.18) rather than a special case here.
    rubric: rubric ?? {
      rubric_id: item.rubricRef,
      version: 0,
      kind: 'criteria',
      status: 'draft',
      appliesTo: [],
      maxScore: 100,
      created_at: '',
      criteria: [],
    },
    questionId: item.id,
    itemVersion: item.version,
    questionType: item.questionType,
    attemptId,
    attemptNumber: previous.length + 1,
    userId: LOCAL_USER,
    submittedAt,
    requiresEvidence: item.requiresEvidence,
    timeSpentSeconds: sanitiseDuration(timeSpentSeconds),
  });

  await appendAttempt({
    attempt_id: attemptId,
    user_id: LOCAL_USER,
    item_id: item.id,
    item_version: item.version,
    attempt_number: previous.length + 1,
    submitted_at: submittedAt,
    answer,
    evaluation,
  });

  revalidatePath('/practice');
  revalidatePath('/progress');
  return { ok: true, evaluation };
}

export interface SqlRunView {
  readonly ok: boolean;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly unknown[])[];
  readonly truncated: boolean;
  readonly errorHe: string | null;
}

/**
 * Try-out execution: runs the learner's query on the VISIBLE dataset only
 * and returns the result. Nothing is scored and nothing is stored — this is
 * the "הרצת השאילתה" step of the exercise loop. Hidden fixtures never run
 * here; they exist only inside evaluation.
 */
export async function runSqlQuery(itemId: string, sql: string): Promise<SqlRunView> {
  const item = await getItem(itemId);
  if (!item || !isExercise(item) || item.questionType !== 'sql_query' || !item.sqlSpec) {
    return { ok: false, columns: [], rows: [], truncated: false, errorHe: t.sqlErrors.exerciseNotFound };
  }
  const dataset = await getDataset(item.sqlSpec.datasetRef);
  if (!dataset) {
    return { ok: false, columns: [], rows: [], truncated: false, errorHe: t.sqlErrors.datasetNotFound };
  }
  const result = await executeSql(sql, dataset);
  return {
    ok: result.ok,
    columns: result.columns,
    rows: result.rows,
    truncated: result.truncated,
    errorHe: result.errorHe,
  };
}

/** Submit a SQL answer: evaluate against the rubric (visible + hidden), store, return. */
export async function submitSqlAnswer(
  itemId: string,
  sql: string,
  timeSpentSeconds?: number,
): Promise<SubmitResult> {
  const item = await getItem(itemId);
  if (!item || !isExercise(item) || item.questionType !== 'sql_query' || !item.sqlSpec) {
    return { ok: false, error: 'exercise-not-found' };
  }
  if (item.pool !== 'practice') return { ok: false, error: 'not-practicable' };

  const [rubric, dataset] = await Promise.all([
    getActiveRubric(item.rubricRef),
    getDataset(item.sqlSpec.datasetRef),
  ]);
  if (!dataset) return { ok: false, error: 'dataset-not-found' };

  const previous = await attemptsForItem(LOCAL_USER, itemId);
  const attemptId = randomUUID();
  const submittedAt = new Date().toISOString();

  const evaluation = await evaluateSql({
    sql,
    spec: item.sqlSpec,
    rubric: rubric ?? {
      rubric_id: item.rubricRef, version: 0, kind: 'criteria', status: 'draft',
      appliesTo: [], maxScore: 100, created_at: '', criteria: [],
    },
    dataset,
    questionId: item.id,
    itemVersion: item.version,
    attemptId,
    attemptNumber: previous.length + 1,
    userId: LOCAL_USER,
    submittedAt,
    timeSpentSeconds: sanitiseDuration(timeSpentSeconds),
  });

  await appendAttempt({
    attempt_id: attemptId,
    user_id: LOCAL_USER,
    item_id: item.id,
    item_version: item.version,
    attempt_number: previous.length + 1,
    submitted_at: submittedAt,
    answer: { sql },
    evaluation,
  });

  revalidatePath('/practice');
  revalidatePath('/progress');
  return { ok: true, evaluation };
}

export async function adminSaveItem(
  itemId: string,
  rawJson: string,
): Promise<{ ok: boolean; error?: string; newStatus?: string }> {
  const result = await saveItemEdit(itemId, rawJson);
  if (result.ok) {
    revalidatePath('/admin/content');
    revalidatePath('/topics');
    revalidatePath('/practice');
  }
  return result;
}

export async function adminPublishItem(
  itemId: string,
): Promise<{ ok: boolean; error?: string; newStatus?: string }> {
  const result = await publishItem(itemId);
  if (result.ok) {
    revalidatePath('/admin/content');
    revalidatePath('/topics');
    revalidatePath('/practice');
  }
  return result;
}

export async function adminApproveItem(
  itemId: string,
  reviewerName: string,
): Promise<{ ok: boolean; error?: string; newStatus?: string }> {
  const result = await approveItem(itemId, reviewerName);
  if (result.ok) {
    revalidatePath('/admin/content');
    revalidatePath('/topics');
    revalidatePath('/practice');
  }
  return result;
}
