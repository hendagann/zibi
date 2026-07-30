'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { DefectReportAnswer, StructuredAnswer } from '@/content/blocks';
import { isExercise } from '@/content/exercise';
import type { ExerciseItem } from '@/content/exercise';
import {
  getActiveRubric,
  getBlueprints,
  getDataset,
  getExamItems,
  getItem,
  getSkills,
} from '@/content/loader';
import { planExam } from '@/exam/planner';
import { computeProgress } from '@/progress/compute';
import { evaluate } from '@/scoring/engine';
import { evaluateMcq, type McqAnswer } from '@/scoring/mcqEngine';
import { evaluateSql } from '@/scoring/sqlEngine';
import type { EvaluationResult } from '@/scoring/types';
import { executeSql } from '@/sql/executor';
import {
  appendAttempt,
  attemptsForItem,
  attemptsForSession,
  attemptsForUser,
  LOCAL_USER,
} from '@/storage/attempts';
import { appendSession, getSession } from '@/storage/examSessions';
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
  answer: DefectReportAnswer | StructuredAnswer,
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

/**
 * Submit an MCQ answer. Deterministic scoring, no rubric detection — the
 * engine is a set-equality check with a synthetic criterion so progress can
 * still attribute the score to a skill and dimension (see mcqEngine.ts).
 *
 * The optional examSessionId routes the attempt as exam evidence when a
 * sitting is active, exactly like the other question families.
 */
export async function submitMcqAnswer(
  itemId: string,
  answer: McqAnswer,
  timeSpentSeconds?: number,
  examSessionId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const item = await getItem(itemId);
  if (!item || !isExercise(item) || item.questionType !== 'mcq_single' || !item.mcqSpec) {
    return { ok: false, error: 'mcq-item-not-found' };
  }
  const exercise = item as ExerciseItem;
  // Local narrowing — the guard above proves it exists, but TS loses that
  // between the closure and the passed field.
  const mcqSpec = exercise.mcqSpec;
  if (!mcqSpec) return { ok: false, error: 'mcq-item-not-found' };

  // Exam mode: refuse repeats within a session (like the other engines), and
  // stamp the attempt with context+session_id.
  if (examSessionId) {
    const prior = await attemptsForSession(LOCAL_USER, examSessionId);
    if (prior.some((a) => a.item_id === itemId)) {
      return { ok: false, error: 'already-answered' };
    }
  } else if (exercise.pool !== 'practice') {
    return { ok: false, error: 'not-practicable' };
  }

  const previous = await attemptsForItem(LOCAL_USER, itemId);
  const attemptId = randomUUID();
  const submittedAt = new Date().toISOString();
  const evaluation = evaluateMcq({
    answer,
    spec: mcqSpec,
    questionId: exercise.id,
    itemVersion: exercise.version,
    attemptId,
    attemptNumber: previous.length + 1,
    userId: LOCAL_USER,
    submittedAt,
    timeSpentSeconds: sanitiseDuration(timeSpentSeconds),
  });

  await appendAttempt({
    attempt_id: attemptId,
    user_id: LOCAL_USER,
    item_id: exercise.id,
    item_version: exercise.version,
    attempt_number: previous.length + 1,
    submitted_at: submittedAt,
    ...(examSessionId ? { context: 'exam' as const, session_id: examSessionId } : {}),
    answer,
    evaluation,
  });

  revalidatePath('/practice');
  revalidatePath('/progress');
  if (examSessionId) revalidatePath(`/exam/${examSessionId}`);
  return { ok: true };
}

/* ---------------- exams — docs/10 ---------------- */

export interface StartExamResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly sessionId?: string;
}

/**
 * Start an exam: plan it once, freeze the plan into a session, and return the
 * session id. The plan is never recomputed afterwards (docs/10 §7.1) — the
 * planner excludes already-attempted items, so re-planning mid-exam would
 * legitimately change a later segment, and a plan that changes is not a plan.
 *
 * A blueprint the pool cannot satisfy does not start. It never starts partially.
 */
export async function startExam(blueprintId: string): Promise<StartExamResult> {
  const [blueprints, examItems, attempts, skills] = await Promise.all([
    getBlueprints(),
    getExamItems(),
    attemptsForUser(LOCAL_USER),
    getSkills(),
  ]);

  const blueprint = blueprints.find((b) => b.id === blueprintId);
  if (!blueprint) return { ok: false, error: 'blueprint-not-found' };

  const progress = computeProgress(
    attempts,
    skills.map((s) => s.id),
    { now: new Date(), topicBySkill: Object.fromEntries(skills.map((s) => [s.id, s.topic])) },
  );

  const plan = planExam(blueprint, examItems.filter(isExercise) as ExerciseItem[], attempts, {
    now: new Date(),
    skills,
    progress: progress.skills,
  });
  if (!plan.ok) return { ok: false, error: 'not-assemblable' };

  const sessionId = randomUUID();
  await appendSession({
    session_id: sessionId,
    user_id: LOCAL_USER,
    blueprint_id: blueprint.id,
    exam_type: blueprint.examType,
    title: blueprint.title,
    started_at: new Date().toISOString(),
    duration_minutes: blueprint.durationMinutes,
    pass_mark: blueprint.passMark,
    segments: plan.segments,
  });

  revalidatePath('/exam');
  return { ok: true, sessionId };
}

/**
 * Submit one exam answer.
 *
 * The return type carries **no evaluation**, and that is the enforcement of
 * docs/10 §7 rule 2: no feedback of any kind is released until the exam ends.
 * There is nowhere in this signature to put a score, so no surface can leak one
 * mid-exam even by accident.
 */
export async function submitExamAnswer(
  sessionId: string,
  itemId: string,
  answer: DefectReportAnswer | StructuredAnswer | { readonly sql: string },
  timeSpentSeconds?: number,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession(LOCAL_USER, sessionId);
  if (!session) return { ok: false, error: 'session-not-found' };

  const segment = session.segments.find((s) => s.itemId === itemId);
  if (!segment) return { ok: false, error: 'item-not-in-exam' };

  const alreadyAnswered = await attemptsForSession(LOCAL_USER, sessionId);
  if (alreadyAnswered.some((a) => a.item_id === itemId)) {
    // An exam answer is final. Re-submitting would let a learner iterate with
    // the clock running, which the pool-isolation rule exists to prevent.
    return { ok: false, error: 'already-answered' };
  }

  const item = await getItem(itemId);
  if (!item || !isExercise(item) || item.pool !== 'exam') {
    return { ok: false, error: 'exam-item-not-found' };
  }
  const exercise = item as ExerciseItem;
  const rubric = await getActiveRubric(exercise.rubricRef);
  const inactiveRubric = {
    rubric_id: exercise.rubricRef, version: 0, kind: 'criteria' as const, status: 'draft' as const,
    appliesTo: [], maxScore: 100, created_at: '', criteria: [],
  };

  const previous = await attemptsForItem(LOCAL_USER, itemId);
  const attemptId = randomUUID();
  const submittedAt = new Date().toISOString();
  const attemptNumber = previous.length + 1;

  let evaluation: EvaluationResult;
  if (exercise.questionType === 'sql_query' && exercise.sqlSpec) {
    const dataset = await getDataset(exercise.sqlSpec.datasetRef);
    if (!dataset) return { ok: false, error: 'dataset-not-found' };
    evaluation = await evaluateSql({
      sql: (answer as { sql: string }).sql,
      spec: exercise.sqlSpec,
      rubric: rubric ?? inactiveRubric,
      dataset,
      questionId: exercise.id,
      itemVersion: exercise.version,
      attemptId,
      attemptNumber,
      userId: LOCAL_USER,
      submittedAt,
      timeSpentSeconds: sanitiseDuration(timeSpentSeconds),
    });
  } else {
    evaluation = evaluate({
      answer: answer as DefectReportAnswer | StructuredAnswer,
      rubric: rubric ?? inactiveRubric,
      questionId: exercise.id,
      itemVersion: exercise.version,
      questionType: exercise.questionType,
      attemptId,
      attemptNumber,
      userId: LOCAL_USER,
      submittedAt,
      requiresEvidence: exercise.requiresEvidence,
      timeSpentSeconds: sanitiseDuration(timeSpentSeconds),
    });
  }

  await appendAttempt({
    attempt_id: attemptId,
    user_id: LOCAL_USER,
    item_id: exercise.id,
    item_version: exercise.version,
    attempt_number: attemptNumber,
    submitted_at: submittedAt,
    context: 'exam',
    session_id: sessionId,
    answer: answer as DefectReportAnswer | StructuredAnswer,
    evaluation,
  });

  revalidatePath(`/exam/${sessionId}`);
  revalidatePath('/exam');
  revalidatePath('/progress');
  return { ok: true };
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
