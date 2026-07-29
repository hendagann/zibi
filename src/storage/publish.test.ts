import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

let dir: string | null = null;

async function writer() {
  dir = await mkdtemp(join(tmpdir(), 'zibi-pub-'));
  await cp(join(process.cwd(), 'content'), dir, { recursive: true });
  vi.stubEnv('ZIBI_CONTENT_ROOT', dir);
  vi.resetModules();
  return import('./contentWriter');
}

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = null;
});

describe('publication gate', () => {
  it('publishes an approved item when the structural check passes', async () => {
    const w = await writer();
    const result = await w.publishItem('DOC-defects.EX.001');
    expect(result).toEqual({ ok: true, newStatus: 'published' });
    const after = JSON.parse(
      await readFile(join(dir!, 'exercises', 'DOC-defects.EX.001.json'), 'utf8'),
    );
    expect(after.review.status).toBe('published');
    expect(after.review.reviewedBy).toBe('hendagan');
  });

  it('refuses to publish an item that is not approved', async () => {
    const w = await writer();
    const raw = await w.readItemRaw('DOC-defects.EX.002');
    const edited = JSON.parse(raw!);
    edited.title = `${edited.title} — עריכה`;
    await w.saveItemEdit('DOC-defects.EX.002', JSON.stringify(edited));
    const result = await w.publishItem('DOC-defects.EX.002');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('אישור מקצועי');
  });

  it('refuses to publish while the structural check fails', async () => {
    const w = await writer();
    // Break the library: rubric weights no longer sum to 100.
    const rubricPath = join(dir!, 'rubrics', 'RUB.BUG_REPORT.json');
    const rubric = JSON.parse(await readFile(rubricPath, 'utf8'));
    rubric.criteria[0].weight = 50;
    const { writeFile } = await import('node:fs/promises');
    await writeFile(rubricPath, JSON.stringify(rubric), 'utf8');

    const result = await w.publishItem('DOC-defects.EX.001');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('בדיקת המבנה');
  });
});
