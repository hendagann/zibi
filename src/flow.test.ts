import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DefectReportAnswer } from '@/content/blocks';

/**
 * The vertical slice, end to end, against a COPY of the real content library:
 * content appears → exercise loads → answer evaluates → attempt persists →
 * revision improves → progress data reflects it → admin edit un-serves and
 * re-approval restores. Everything runs through the same modules the pages
 * use; nothing is mocked except the directories.
 */

let contentDir: string | null = null;
let dataDir: string | null = null;

async function slice() {
  contentDir = await mkdtemp(join(tmpdir(), 'zibi-slice-content-'));
  dataDir = await mkdtemp(join(tmpdir(), 'zibi-slice-data-'));
  await cp(join(process.cwd(), 'content'), contentDir, { recursive: true });
  vi.stubEnv('ZIBI_CONTENT_ROOT', contentDir);
  vi.stubEnv('ZIBI_DATA_ROOT', dataDir);
  vi.resetModules();
  const loader = await import('@/content/loader');
  const storage = await import('@/storage/attempts');
  const writer = await import('@/storage/contentWriter');
  const engine = await import('@/scoring/engine');
  return { loader, storage, writer, engine };
}

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  for (const dir of [contentDir, dataDir]) {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
  contentDir = dataDir = null;
});

async function submit(
  mods: Awaited<ReturnType<typeof slice>>,
  itemId: string,
  answer: DefectReportAnswer,
) {
  const { loader, storage, engine } = mods;
  const item = (await loader.getItem(itemId)) as import('@/content/exercise').ExerciseItem;
  expect(item).not.toBeNull();
  const rubric = await loader.getActiveRubric(item.rubricRef);
  expect(rubric).not.toBeNull();
  const previous = await storage.attemptsForItem(storage.LOCAL_USER, itemId);
  const attemptNumber = previous.length + 1;
  const evaluation = engine.evaluate({
    answer,
    rubric: rubric!,
    questionId: item.id,
    itemVersion: item.version,
    questionType: item.questionType,
    attemptId: `flow-${attemptNumber}`,
    attemptNumber,
    userId: storage.LOCAL_USER,
    submittedAt: new Date(2026, 6, 29, 10, attemptNumber).toISOString(),
    requiresEvidence: item.requiresEvidence,
  });
  await storage.appendAttempt({
    attempt_id: `flow-${attemptNumber}`,
    user_id: storage.LOCAL_USER,
    item_id: item.id,
    item_version: item.version,
    attempt_number: attemptNumber,
    submitted_at: evaluation.submitted_at,
    answer,
    evaluation,
  });
  return evaluation;
}

const WEAK: DefectReportAnswer = {
  title: 'באג בתשלום',
  environment: '',
  preconditions: '',
  steps: ['ללחוץ פעמיים'],
  actual: 'נוצרו שתי הזמנות',
  expected: '',
  evidence: '',
  severity: 'high',
  severityJustification: '',
};

describe('the vertical slice', () => {
  it('the topic appears in the map with its content', async () => {
    const { loader } = await slice();
    const topics = await loader.getTopics();
    expect(topics.map((topic) => topic.id)).toContain('DOC/defects');
    const exercises = await loader.getPracticeExercises();
    expect(exercises).toHaveLength(5);
    const summary = await loader.getItem('DOC-defects.SUM.001');
    expect(summary?.type).toBe('summary');
  });

  it('weak answer → capped score; revision → higher score; both stored; progress sees both', async () => {
    const mods = await slice();
    const { storage, loader } = mods;

    const first = await submit(mods, 'DOC-defects.EX.001', WEAK);
    expect(first.final_score).toBeGreaterThan(0);
    expect(first.score_cap).toBe(60);

    const item = (await loader.getItem('DOC-defects.EX.001')) as import('@/content/exercise').ExerciseItem;
    const second = await submit(mods, 'DOC-defects.EX.001', item.modelAnswer);
    expect(second.final_score).toBe(100);
    expect(second.attempt_number).toBe(2);

    // Both attempts persisted; the first is untouched (the pass gate).
    const stored = await storage.attemptsForItem(storage.LOCAL_USER, 'DOC-defects.EX.001');
    expect(stored).toHaveLength(2);
    expect(stored[0]?.evaluation.final_score).toBe(first.final_score);
    expect(stored[1]?.evaluation.final_score).toBe(100);

    // The learner can see what improved: per-criterion deltas are derivable
    // from the two stored evaluations.
    const improved = second.criterion_results.filter((c) => {
      const prev = stored[0]?.evaluation.criterion_results.find(
        (p) => p.criterion_id === c.criterion_id,
      );
      return prev && c.awarded_points > prev.awarded_points;
    });
    expect(improved.length).toBeGreaterThan(0);

    // Progress input: per-skill scores from both attempts, demonstrated
    // performance only.
    const all = await storage.attemptsForUser(storage.LOCAL_USER);
    const skillScores = all.map((a) => a.evaluation.per_skill_scores['DOC.BUG']);
    expect(skillScores).toHaveLength(2);
    expect(skillScores[1]).toBeGreaterThan(skillScores[0] ?? 0);
  });

  it('feedback is rubric-bound: every criterion links back into the lesson', async () => {
    const mods = await slice();
    const first = await submit(mods, 'DOC-defects.EX.001', WEAK);
    const lesson = await mods.loader.getItem('DOC-defects.LE.001');
    const lessonBids = new Set(
      ((lesson as { body?: { bid?: string }[] })?.body ?? [])
        .map((b) => b.bid)
        .filter(Boolean),
    );
    for (const criterion of first.criterion_results) {
      expect(criterion.remediation.ref, criterion.criterion_id).toBeTruthy();
      if (criterion.remediation.anchor) {
        // The anchor must exist as a block id in the lesson it points at —
        // the "revision links lead to the right part" gate, mechanically.
        expect(lessonBids.has(criterion.remediation.anchor), criterion.remediation.anchor).toBe(true);
      }
    }
  });

  it('admin edit un-serves the item; re-approval restores it — no code change involved', async () => {
    const mods = await slice();
    const { loader, writer } = mods;

    const before = await loader.getItem('DOC-defects.EX.002');
    expect(before).not.toBeNull();

    const raw = await writer.readItemRaw('DOC-defects.EX.002');
    const edited = JSON.parse(raw!) as { title: string };
    edited.title = 'חיפוש שמתעלם מהמילה השנייה — נוסח מעודכן';
    const save = await writer.saveItemEdit('DOC-defects.EX.002', JSON.stringify(edited));
    expect(save.ok).toBe(true);
    expect(save.newStatus).toBe('needs_update');

    // The edit is live on disk and the learner no longer sees the item.
    const afterEdit = await loader.getItem('DOC-defects.EX.002');
    expect(afterEdit).toBeNull();
    const onDisk = JSON.parse((await readFile(join(contentDir!, 'exercises', 'DOC-defects.EX.002.json'), 'utf8')));
    expect(onDisk.title).toContain('נוסח מעודכן');
    expect(onDisk.version).toBe(2);

    // Approval without a reviewer name is refused (docs/05 §7).
    expect((await writer.approveItem('DOC-defects.EX.002', '  ')).ok).toBe(false);

    const approve = await writer.approveItem('DOC-defects.EX.002', 'רות');
    expect(approve.ok).toBe(true);
    const restored = await loader.getItem('DOC-defects.EX.002');
    expect(restored?.title).toContain('נוסח מעודכן');
    expect(restored?.version).toBe(2);
  });

  it('the editor cannot smuggle an approved status in with an edit', async () => {
    const mods = await slice();
    const raw = await mods.writer.readItemRaw('DOC-defects.EX.003');
    const edited = JSON.parse(raw!) as { review: { status: string } };
    edited.review = { status: 'approved' };
    await mods.writer.saveItemEdit('DOC-defects.EX.003', JSON.stringify(edited));
    const onDisk = JSON.parse(
      await readFile(join(contentDir!, 'exercises', 'DOC-defects.EX.003.json'), 'utf8'),
    );
    expect(onDisk.review.status).toBe('needs_update');
  });
});
