'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { DefectReportAnswer } from '@/content/blocks';
import { isExercise } from '@/content/exercise';
import { getActiveRubric, getItem } from '@/content/loader';
import { evaluate } from '@/scoring/engine';
import type { EvaluationResult } from '@/scoring/types';
import {
  appendAttempt,
  attemptsForItem,
  LOCAL_USER,
} from '@/storage/attempts';
import { approveItem, publishItem, saveItemEdit } from '@/storage/contentWriter';

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
