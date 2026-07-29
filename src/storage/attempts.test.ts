import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AttemptRecord } from './attempts';

let dir: string | null = null;

async function storage() {
  dir = await mkdtemp(join(tmpdir(), 'zibi-data-'));
  vi.stubEnv('ZIBI_DATA_ROOT', dir);
  vi.resetModules();
  return import('./attempts');
}

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  if (dir) {
    await rm(dir, { recursive: true, force: true });
    dir = null;
  }
});

function record(n: number, itemId = 'DOC-defects.EX.001'): AttemptRecord {
  return {
    attempt_id: `a${n}`,
    user_id: 'local',
    item_id: itemId,
    item_version: 1,
    attempt_number: n,
    submitted_at: `2026-07-29T10:0${n}:00.000Z`,
    answer: {
      title: `attempt ${n}`, environment: '', preconditions: '',
      steps: [''], actual: '', expected: '', evidence: '',
      severity: '', severityJustification: '',
    },
    evaluation: { final_score: n * 10 } as AttemptRecord['evaluation'],
  };
}

describe('attempt storage', () => {
  it('persists an attempt across module reloads (page refresh survives)', async () => {
    const first = await storage();
    await first.appendAttempt(record(1));
    // A fresh import is the server-side equivalent of a page refresh.
    vi.resetModules();
    const second = await import('./attempts');
    const stored = await second.attemptsForItem('local', 'DOC-defects.EX.001');
    expect(stored).toHaveLength(1);
    expect((stored[0]?.answer as { title: string }).title).toBe('attempt 1');
    expect(stored[0]?.evaluation.final_score).toBe(10);
  });

  it('a repeat attempt appends — it never erases the previous one', async () => {
    const store = await storage();
    await store.appendAttempt(record(1));
    await store.appendAttempt(record(2));
    await store.appendAttempt(record(3));
    const stored = await store.attemptsForItem('local', 'DOC-defects.EX.001');
    expect(stored).toHaveLength(3);
    expect(stored.map((a) => a.attempt_number)).toEqual([1, 2, 3]);
    // The earlier answers are intact, not overwritten.
    expect((stored[0]?.answer as { title: string }).title).toBe('attempt 1');
    expect((stored[1]?.answer as { title: string }).title).toBe('attempt 2');
  });

  it('exposes no update or delete surface at all', async () => {
    const store = await storage();
    const mutators = Object.keys(store).filter((k) => /update|delete|remove|overwrite|clear/i.test(k));
    expect(mutators).toEqual([]);
  });

  it('separates items and users', async () => {
    const store = await storage();
    await store.appendAttempt(record(1, 'DOC-defects.EX.001'));
    await store.appendAttempt(record(1, 'DOC-defects.EX.002'));
    expect(await store.attemptsForItem('local', 'DOC-defects.EX.001')).toHaveLength(1);
    expect(await store.attemptsForItem('local', 'DOC-defects.EX.002')).toHaveLength(1);
    expect(await store.attemptsForItem('someone-else', 'DOC-defects.EX.001')).toHaveLength(0);
  });
});
