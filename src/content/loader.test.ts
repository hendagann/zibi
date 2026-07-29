import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Empty-library behaviour, pinned against an empty fixture directory.
 *
 * The real content/ is populated now, so these tests stub ZIBI_CONTENT_ROOT:
 * the loader must represent an empty library as empty collections — never an
 * error, never a placeholder. The populated-library behaviour (including the
 * approved-only rule) is covered by loader.fixture.test.ts and flow.test.ts.
 */

let emptyDir: string;
let loader: typeof import('./loader');

beforeAll(async () => {
  emptyDir = await mkdtemp(join(tmpdir(), 'zibi-empty-'));
  vi.stubEnv('ZIBI_CONTENT_ROOT', emptyDir);
  vi.resetModules();
  loader = await import('./loader');
});

afterAll(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  await rm(emptyDir, { recursive: true, force: true });
});

describe('content loader with an empty library', () => {
  it('returns no domains', async () => {
    await expect(loader.getDomains()).resolves.toEqual([]);
  });

  it('returns no topics', async () => {
    await expect(loader.getTopics()).resolves.toEqual([]);
  });

  it('returns no skills', async () => {
    await expect(loader.getSkills()).resolves.toEqual([]);
  });

  it('returns no items', async () => {
    await expect(loader.getItems()).resolves.toEqual([]);
  });

  it('resolves a missing topic to null rather than throwing', async () => {
    await expect(loader.getTopic('TD/black-box')).resolves.toBeNull();
  });

  it('keeps the practice and exam pools separate and both empty', async () => {
    await expect(loader.getPracticeExercises()).resolves.toEqual([]);
    await expect(loader.getExamItems()).resolves.toEqual([]);
  });

  it('returns no rubric when none exists', async () => {
    await expect(loader.getActiveRubric('RUB.BUG_REPORT')).resolves.toBeNull();
  });
});
