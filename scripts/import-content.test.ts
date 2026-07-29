import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const SCRIPT = join(process.cwd(), 'scripts', 'import-content.mjs');

/**
 * The import pipeline: bundles land in the right directories, no bundle can
 * arrive pre-approved, and collisions are refused without --update.
 */

const dirs: string[] = [];

async function setup(): Promise<{ root: string; bundleAt: (b: object) => Promise<string> }> {
  const root = await mkdtemp(join(tmpdir(), 'zibi-import-'));
  dirs.push(root);
  await cp(join(process.cwd(), 'content'), root, { recursive: true });
  return {
    root,
    bundleAt: async (bundle: object) => {
      const path = join(root, 'bundle.json');
      await writeFile(path, JSON.stringify(bundle), 'utf8');
      return path;
    },
  };
}

async function importBundle(root: string, bundlePath: string, ...flags: string[]) {
  try {
    const { stdout } = await run(process.execPath, [SCRIPT, bundlePath, ...flags], {
      env: { ...process.env, ZIBI_CONTENT_ROOT: root },
    });
    return { code: 0, out: stdout };
  } catch (error) {
    const err = error as { code?: number; stdout?: string; stderr?: string };
    return { code: err.code ?? 1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

const draftExercise = (id: string, status = 'ai_generated') => ({
  id,
  type: 'exercise',
  schemaVersion: 1,
  topic: 'DOC/defects',
  skills: { primary: 'DOC.BUG' },
  title: 'תרגיל מיובא',
  lang: 'he',
  dir: 'rtl',
  estimatedSeconds: 300,
  pool: 'practice',
  questionType: 'author_defect_report',
  requiresEvidence: false,
  rubricRef: 'RUB.BUG_REPORT',
  revisionRefs: ['DOC-defects.SUM.001'],
  source: [{ sourceId: 'SRC-ITCB-CTFL-HE', derivation: 'original' }],
  review: { status },
  modelAnswer: {},
});

describe('content import', () => {
  it('writes each entity type into its directory', async () => {
    const { root, bundleAt } = await setup();
    const bundle = await bundleAt({ items: [draftExercise('DOC-defects.EX.006')] });
    const { code, out } = await importBundle(root, bundle);
    expect(code).toBe(0);
    expect(out).toContain('DOC-defects.EX.006');
    const written = JSON.parse(
      await readFile(join(root, 'exercises', 'DOC-defects.EX.006.json'), 'utf8'),
    );
    expect(written.review.status).toBe('ai_generated');
    expect(written.version).toBe(1);
  });

  it('a bundle cannot arrive approved or published', async () => {
    const { root, bundleAt } = await setup();
    const bundle = await bundleAt({
      items: [draftExercise('DOC-defects.EX.007', 'published')],
    });
    const { code, out } = await importBundle(root, bundle);
    expect(code).toBe(0);
    expect(out).toContain('needs_professional_review');
    const written = JSON.parse(
      await readFile(join(root, 'exercises', 'DOC-defects.EX.007.json'), 'utf8'),
    );
    expect(written.review.status).toBe('needs_professional_review');
    expect(written.review.reviewedBy).toBeUndefined();
  });

  it('refuses to overwrite an existing id without --update', async () => {
    const { root, bundleAt } = await setup();
    const bundle = await bundleAt({ items: [draftExercise('DOC-defects.EX.001')] });
    const { code, out } = await importBundle(root, bundle);
    expect(code).not.toBe(0);
    expect(out).toContain('--update');
    // The existing approved exercise is untouched.
    const existing = JSON.parse(
      await readFile(join(root, 'exercises', 'DOC-defects.EX.001.json'), 'utf8'),
    );
    expect(existing.review.status).toBe('approved');
  });

  it('--update bumps the version and resets the status, like an admin edit', async () => {
    const { root, bundleAt } = await setup();
    // Read the starting version rather than assuming it: the guarantee under
    // test is the increment, not the absolute number.
    const beforeVersion = JSON.parse(
      await readFile(join(root, 'exercises', 'DOC-defects.EX.001.json'), 'utf8'),
    ).version as number;
    const bundle = await bundleAt({ items: [draftExercise('DOC-defects.EX.001', 'draft')] });
    const { code } = await importBundle(root, bundle, '--update');
    expect(code).toBe(0);
    const updated = JSON.parse(
      await readFile(join(root, 'exercises', 'DOC-defects.EX.001.json'), 'utf8'),
    );
    expect(updated.version).toBe(beforeVersion + 1);
    expect(updated.review.status).toBe('draft');
  });

  it('refuses an imported source without a licence status (SRC-01 at the gate)', async () => {
    const { root, bundleAt } = await setup();
    const bundle = await bundleAt({
      sources: [{ id: 'SRC-NEW-THING', title: 'x', publisher: 'y', language: 'he', format: 'pdf', imported: true }],
    });
    const { code, out } = await importBundle(root, bundle);
    expect(code).not.toBe(0);
    expect(out).toContain('SRC-01');
  });

  it('a rubric cannot arrive active', async () => {
    const { root, bundleAt } = await setup();
    const bundle = await bundleAt({
      rubrics: [{ rubric_id: 'RUB.NEW_THING', status: 'active', criteria: [] }],
    });
    const { code, out } = await importBundle(root, bundle);
    expect(code).toBe(0);
    expect(out).toContain('needs_review');
    const written = JSON.parse(
      await readFile(join(root, 'rubrics', 'RUB.NEW_THING.json'), 'utf8'),
    );
    expect(written.status).toBe('needs_review');
  });
});
