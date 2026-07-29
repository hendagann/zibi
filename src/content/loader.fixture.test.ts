import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Loads the loader against a fixture library that CONTAINS content, so these
 * tests can tell the difference between "the library is empty" and "the
 * loader throws everything away". The empty-library tests in loader.test.ts
 * cannot make that distinction on their own.
 *
 * The rule under test is docs/05 §7: only `approved` content is ever served.
 */

let fixtureDir: string | null = null;

async function loaderWithFixture(files: Record<string, object>) {
  fixtureDir = await mkdtemp(join(tmpdir(), 'zibi-content-'));
  for (const [relPath, value] of Object.entries(files)) {
    const full = join(fixtureDir, relPath);
    await mkdir(join(full, '..'), { recursive: true });
    await writeFile(full, JSON.stringify(value), 'utf8');
  }
  vi.stubEnv('ZIBI_CONTENT_ROOT', fixtureDir);
  vi.resetModules();
  return import('./loader');
}

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  if (fixtureDir) {
    await rm(fixtureDir, { recursive: true, force: true });
    fixtureDir = null;
  }
});

const approvedReview = { status: 'approved', reviewedBy: 'x', reviewedAt: '2026-07-29' };

function topic(id: string, status: string) {
  return {
    id,
    nameHe: 'נושא',
    nameEn: 'Topic',
    domain: id.split('/')[0],
    description: '',
    learningObjectives: [],
    prerequisites: [],
    difficulty: 1,
    estimatedMinutes: 10,
    measuredSkills: [],
    summaryRef: null,
    lessonRefs: [],
    exerciseRefs: [],
    topicExamRef: null,
    review: status === 'approved' ? approvedReview : { status },
  };
}

function item(id: string, type: string, pool: string, reviewStatus: string) {
  return {
    id,
    type,
    schemaVersion: 1,
    title: 'x',
    lang: 'he',
    dir: 'rtl',
    estimatedSeconds: 60,
    pool,
    source: [{ sourceId: 'SRC-X', derivation: 'original' }],
    review: reviewStatus === 'approved' ? approvedReview : { status: reviewStatus },
    version: 1,
    status: 'active',
  };
}

describe('approved-only serving (docs/05 §7)', () => {
  it('serves approved topics and withholds every other review status', async () => {
    const loader = await loaderWithFixture({
      'topics/a.json': topic('TD/black-box', 'approved'),
      'topics/b.json': topic('TD/framing', 'draft'),
      'topics/c.json': topic('TD/adequacy', 'in_review'),
      'topics/d.json': topic('TD/experience-based', 'needs_update'),
    });
    const topics = await loader.getTopics();
    expect(topics.map((t) => t.id)).toEqual(['TD/black-box']);
  });

  it('serves approved items only, and getTopic misses a draft topic', async () => {
    const loader = await loaderWithFixture({
      'topics/a.json': topic('TD/black-box', 'draft'),
      'items/e1.json': item('TD-black-box.EX.001', 'exercise', 'practice', 'approved'),
      'items/e2.json': item('TD-black-box.EX.002', 'exercise', 'practice', 'draft'),
    });
    const items = await loader.getItems();
    expect(items.map((i) => i.id)).toEqual(['TD-black-box.EX.001']);
    // A draft topic must be indistinguishable from a missing one.
    await expect(loader.getTopic('TD/black-box')).resolves.toBeNull();
  });

  it('actually separates the pools when both contain approved items', async () => {
    const loader = await loaderWithFixture({
      'items/p.json': item('TD-black-box.EX.001', 'exercise', 'practice', 'approved'),
      'items/x.json': item('TD-black-box.XM.001', 'exam_item', 'exam', 'approved'),
    });
    const practice = await loader.getPracticeExercises();
    const exam = await loader.getExamItems();
    expect(practice.map((i) => i.id)).toEqual(['TD-black-box.EX.001']);
    expect(exam.map((i) => i.id)).toEqual(['TD-black-box.XM.001']);
  });

  it('filters retired items even when approved', async () => {
    const retired = {
      ...item('TD-black-box.EX.003', 'exercise', 'practice', 'approved'),
      status: 'retired',
    };
    const loader = await loaderWithFixture({ 'items/r.json': retired });
    await expect(loader.getItems()).resolves.toEqual([]);
  });
});
