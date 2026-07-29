import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DefectReportAnswer } from '@/content/blocks';
import type { ExamSession } from '@/storage/examSessions';
import { computeExamResult, currentSegment, isComplete } from './session';

/**
 * The exam sitting, end to end, against a COPY of the real content library:
 * plan → freeze → answer each segment → score released only at the end →
 * attempts stored as exam evidence → the same items refused next time.
 *
 * Nothing is mocked except the directories. The same modules the pages use are
 * the ones under test.
 */

let contentDir: string | null = null;
let dataDir: string | null = null;

async function slice() {
  contentDir = await mkdtemp(join(tmpdir(), 'zibi-exam-content-'));
  dataDir = await mkdtemp(join(tmpdir(), 'zibi-exam-data-'));
  await cp(join(process.cwd(), 'content'), contentDir, { recursive: true });
  vi.stubEnv('ZIBI_CONTENT_ROOT', contentDir);
  vi.stubEnv('ZIBI_DATA_ROOT', dataDir);
  vi.resetModules();
  return {
    loader: await import('@/content/loader'),
    storage: await import('@/storage/attempts'),
    sessions: await import('@/storage/examSessions'),
    engine: await import('@/scoring/engine'),
    planner: await import('./planner'),
    progress: await import('@/progress/compute'),
    exercise: await import('@/content/exercise'),
  };
}

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  for (const dir of [contentDir, dataDir]) {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
  contentDir = dataDir = null;
});

const NOW = new Date('2026-07-30T12:00:00.000Z');

const WEAK: DefectReportAnswer = {
  title: 'לא עובד',
  environment: '',
  preconditions: '',
  steps: ['לנסות'],
  actual: 'נכשל',
  expected: '',
  evidence: '',
  severity: 'high',
  severityJustification: '',
};

type Mods = Awaited<ReturnType<typeof slice>>;

async function planTopicExam(mods: Mods) {
  const { loader, planner, exercise, storage } = mods;
  const blueprints = await loader.getBlueprints();
  const blueprint = blueprints.find((b) => b.id === 'DOC-defects.BP.001');
  expect(blueprint).toBeDefined();
  const pool = (await loader.getExamItems()).filter(exercise.isExercise);
  const attempts = await storage.attemptsForUser(storage.LOCAL_USER);
  return {
    blueprint: blueprint!,
    plan: planner.planExam(blueprint!, pool, attempts, {
      now: NOW,
      skills: await loader.getSkills(),
    }),
  };
}

async function freeze(mods: Mods): Promise<ExamSession> {
  const { blueprint, plan } = await planTopicExam(mods);
  expect(plan.ok).toBe(true);
  if (!plan.ok) throw new Error('unreachable');
  const session: ExamSession = {
    session_id: 'sitting-1',
    user_id: mods.storage.LOCAL_USER,
    blueprint_id: blueprint.id,
    exam_type: blueprint.examType,
    title: blueprint.title,
    started_at: NOW.toISOString(),
    duration_minutes: blueprint.durationMinutes,
    pass_mark: blueprint.passMark,
    segments: plan.segments,
  };
  await mods.sessions.appendSession(session);
  return session;
}

/** Answer one segment exactly as the exam action does. */
async function answer(
  mods: Mods,
  session: ExamSession,
  itemId: string,
  submission: DefectReportAnswer,
  minute: number,
) {
  const { loader, storage, engine, exercise } = mods;
  const item = (await loader.getItem(itemId)) as import('@/content/exercise').ExerciseItem;
  expect(exercise.isExercise(item)).toBe(true);
  const rubric = await loader.getActiveRubric(item.rubricRef);
  expect(rubric).not.toBeNull();
  const submittedAt = new Date(Date.UTC(2026, 6, 30, 12, minute)).toISOString();
  const evaluation = engine.evaluate({
    answer: submission,
    rubric: rubric!,
    questionId: item.id,
    itemVersion: item.version,
    questionType: item.questionType,
    attemptId: `ex-${itemId}`,
    attemptNumber: 1,
    userId: storage.LOCAL_USER,
    submittedAt,
    requiresEvidence: item.requiresEvidence,
  });
  await storage.appendAttempt({
    attempt_id: `ex-${itemId}`,
    user_id: storage.LOCAL_USER,
    item_id: item.id,
    item_version: item.version,
    attempt_number: 1,
    submitted_at: submittedAt,
    context: 'exam',
    session_id: session.session_id,
    answer: submission,
    evaluation,
  });
  return evaluation;
}

describe('the exam sitting', () => {
  it('the topic exam assembles from the real library', async () => {
    const mods = await slice();
    const { plan } = await planTopicExam(mods);

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.segments).toHaveLength(2);
    // Every chosen item really is an exam-pool item.
    const pool = (await mods.loader.getExamItems()).map((i) => i.id);
    for (const segment of plan.segments) expect(pool).toContain(segment.itemId);
    // And it fits the 20-minute budget.
    expect(plan.totalSeconds).toBeLessThanOrEqual(plan.durationMinutes * 60);
  });

  it('advances segment by segment and releases the score only at the end', async () => {
    const mods = await slice();
    const session = await freeze(mods);
    const { storage } = mods;

    const first = session.segments[0]!;
    const second = session.segments[1]!;

    // Nothing answered: on the first segment, no result yet.
    let attempts = await storage.attemptsForSession(storage.LOCAL_USER, session.session_id);
    expect(currentSegment(session, attempts)?.itemId).toBe(first.itemId);
    expect(computeExamResult(session, attempts)).toBeNull();

    await answer(mods, session, first.itemId, WEAK, 5);
    attempts = await storage.attemptsForSession(storage.LOCAL_USER, session.session_id);
    // Moved on — and STILL no result, because the exam is not over.
    expect(currentSegment(session, attempts)?.itemId).toBe(second.itemId);
    expect(isComplete(session, attempts)).toBe(false);
    expect(computeExamResult(session, attempts)).toBeNull();

    const model = (await mods.loader.getItem(second.itemId)) as unknown as {
      modelAnswer: DefectReportAnswer;
    };
    await answer(mods, session, second.itemId, model.modelAnswer, 12);
    attempts = await storage.attemptsForSession(storage.LOCAL_USER, session.session_id);

    expect(isComplete(session, attempts)).toBe(true);
    const result = computeExamResult(session, attempts)!;
    expect(result.perSegment).toHaveLength(2);
    // The model answer scores 100; the weak one is capped well below it.
    expect(result.perSegment[1]!.score).toBe(100);
    expect(result.perSegment[0]!.score).toBeLessThan(70);
    // Unweighted mean of the two segments, rounded once.
    const expected = Math.floor(
      (result.perSegment[0]!.score + result.perSegment[1]!.score) / 2 + 0.5,
    );
    expect(result.examScore).toBe(expected);
    expect(result.passed).toBe(result.examScore >= session.pass_mark);
  });

  it('stores exam answers as exam evidence, and progress counts them', async () => {
    const mods = await slice();
    const session = await freeze(mods);
    await answer(mods, session, session.segments[0]!.itemId, WEAK, 5);

    const stored = await mods.storage.attemptsForSession(
      mods.storage.LOCAL_USER,
      session.session_id,
    );
    expect(stored).toHaveLength(1);
    expect(stored[0]!.context).toBe('exam');
    expect(stored[0]!.session_id).toBe(session.session_id);

    // The same attempt log drives the progress model — an exam is evidence.
    const skills = await mods.loader.getSkills();
    const all = await mods.storage.attemptsForUser(mods.storage.LOCAL_USER);
    const overall = mods.progress.computeProgress(
      all,
      skills.map((s) => s.id),
      { now: NOW },
    );
    expect(overall.totalAttempts).toBe(1);
    expect(overall.skills.length).toBeGreaterThan(0);
  });

  it('will not serve the same items in a second sitting', async () => {
    const mods = await slice();
    const session = await freeze(mods);
    await answer(mods, session, session.segments[0]!.itemId, WEAK, 5);
    const model = (await mods.loader.getItem(session.segments[1]!.itemId)) as unknown as {
      modelAnswer: DefectReportAnswer;
    };
    await answer(mods, session, session.segments[1]!.itemId, model.modelAnswer, 12);

    // Both 10-minute exam items are now spent, so the blueprint cannot be
    // satisfied again and it refuses rather than repeating a seen question.
    const { plan } = await planTopicExam(mods);
    expect(plan.ok).toBe(false);
    if (plan.ok) return;

    // The refusal is specific about WHY, and the reason is not "nothing left":
    // one unseen item remains (the 11-minute severity item) and it simply does
    // not fit a 10-minute segment. Reporting that precisely, rather than a
    // generic "unavailable", is the whole purpose of separate refusal codes.
    expect(plan.reasons.map((r) => r.code)).toContain('segment_over_budget');
    const overBudget = plan.reasons.find((r) => r.code === 'segment_over_budget');
    expect(overBudget?.values?.budgetSeconds).toBe(600);
    expect(Number(overBudget?.values?.shortestCandidateSeconds)).toBeGreaterThan(600);
  });

  it('a reload cannot lose or repeat a question', async () => {
    const mods = await slice();
    const session = await freeze(mods);
    await answer(mods, session, session.segments[0]!.itemId, WEAK, 5);

    // Position is derived from storage, so reading it repeatedly is stable.
    const attempts = await mods.storage.attemptsForSession(
      mods.storage.LOCAL_USER,
      session.session_id,
    );
    const first = currentSegment(session, attempts);
    for (let i = 0; i < 3; i += 1) {
      expect(currentSegment(session, attempts)).toEqual(first);
    }
    expect(first?.itemId).toBe(session.segments[1]!.itemId);
  });
});

describe('the exam score — docs/10 §7.2', () => {
  const session = (segments: readonly { itemId: string }[]): ExamSession =>
    ({
      session_id: 's',
      user_id: 'local',
      blueprint_id: 'B',
      exam_type: 'topic',
      title: 'x',
      started_at: NOW.toISOString(),
      duration_minutes: 20,
      pass_mark: 70,
      segments: segments.map((s, i) => ({
        segmentId: `s${i}`,
        titleHe: `s${i}`,
        minutes: 5,
        itemId: s.itemId,
        questionFamily: 'author_defect_report',
        skillId: 'DOC.BUG',
        estimatedSeconds: 300,
        open: true,
        judgement: false,
      })),
    }) as ExamSession;

  const attemptFor = (itemId: string, score: number, unevaluable = false) =>
    ({
      attempt_id: itemId,
      user_id: 'local',
      item_id: itemId,
      item_version: 1,
      attempt_number: 1,
      submitted_at: '2026-07-30T12:05:00.000Z',
      context: 'exam' as const,
      session_id: 's',
      answer: { sql: '' },
      evaluation: { final_score: score, unevaluable },
    }) as unknown as import('@/storage/attempts').AttemptRecord;

  it('is the unweighted mean, rounded half up', () => {
    const s = session([{ itemId: 'a' }, { itemId: 'b' }]);
    const result = computeExamResult(s, [attemptFor('a', 62), attemptFor('b', 63)])!;
    // 62.5 → 63, never banker's rounding (docs/07 §5.2).
    expect(result.examScore).toBe(63);
  });

  it('excludes an unevaluable segment instead of scoring it zero', () => {
    const s = session([{ itemId: 'a' }, { itemId: 'b' }]);
    const result = computeExamResult(s, [
      attemptFor('a', 80),
      attemptFor('b', 0, true),
    ])!;
    // A broken item is our defect: the mean is 80, not 40.
    expect(result.examScore).toBe(80);
    expect(result.scoredSegments).toBe(1);
    expect(result.perSegment[1]!.unevaluable).toBe(true);
  });

  it('passes exactly at the pass mark', () => {
    const s = session([{ itemId: 'a' }]);
    expect(computeExamResult(s, [attemptFor('a', 70)])!.passed).toBe(true);
    expect(computeExamResult(s, [attemptFor('a', 69)])!.passed).toBe(false);
  });
});
