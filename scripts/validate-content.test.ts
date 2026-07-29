import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const SCRIPT = join(process.cwd(), 'scripts', 'validate-content.mjs');

/**
 * Each of the requested validator rules is proven to actually fire: a copy of
 * the real library is broken in exactly one way, and the validator must
 * report exactly that rule. A checker that silently stops catching things is
 * worse than none — the same principle as the boundary-checker tests.
 */

const dirs: string[] = [];

async function libraryCopy(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'zibi-validate-'));
  dirs.push(dir);
  await cp(join(process.cwd(), 'content'), dir, { recursive: true });
  return dir;
}

async function check(root: string): Promise<{ code: number; out: string }> {
  try {
    const { stdout } = await run(process.execPath, [SCRIPT], {
      env: { ...process.env, ZIBI_CONTENT_ROOT: root },
    });
    return { code: 0, out: stdout };
  } catch (error) {
    const err = error as { code?: number; stderr?: string; stdout?: string };
    return { code: err.code ?? 1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

async function mutate(
  root: string,
  relPath: string,
  change: (data: Record<string, unknown>) => void,
): Promise<void> {
  const path = join(root, relPath);
  const data = JSON.parse(await readFile(path, 'utf8'));
  change(data);
  await writeFile(path, JSON.stringify(data, null, 2), 'utf8');
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe('content validator rules', () => {
  it('passes the real library', async () => {
    const root = await libraryCopy();
    const { code } = await check(root);
    expect(code).toBe(0);
  });

  it('catches a duplicate id (CM-02)', async () => {
    const root = await libraryCopy();
    const raw = await readFile(join(root, 'exercises', 'DOC-defects.EX.001.json'), 'utf8');
    // Same id, second file — the filename matches the id it claims.
    await cp(
      join(root, 'exercises', 'DOC-defects.EX.001.json'),
      join(root, 'exams', 'DOC-defects.EX.001.json'),
    );
    expect(raw).toContain('DOC-defects.EX.001');
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-02');
  });

  it('catches a common mistake citing an unregistered misconception (QM-07)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exercises/DOC-defects.EX.001.json', (data) => {
      data.commonMistakes = [
        {
          misconceptionId: 'MIS.BUG.DOES_NOT_EXIST',
          descriptionHe: 'משהו',
          whyTempting: 'משהו',
          remediationRef: 'DOC-defects.LE.001',
        },
      ];
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('QM-07');
  });

  it('accepts a common mistake that does resolve in the registry (QM-07)', async () => {
    // The paired positive case: without it, QM-07 passing proves nothing.
    const root = await libraryCopy();
    await mutate(root, 'exercises/DOC-defects.EX.001.json', (data) => {
      data.commonMistakes = [
        {
          misconceptionId: 'MIS.BUG.TITLE_AREA_ONLY',
          descriptionHe: 'כותרת בלי תקלה',
          whyTempting: 'ההקשר ברור לכותבת',
          remediationRef: 'DOC-defects.LE.001',
          anchor: 'sec-title',
        },
      ];
    });
    const { code } = await check(root);
    expect(code).toBe(0);
  });

  it('catches a common mistake pointing at unapproved revision material (QM-16)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exercises/DOC-defects.EX.001.json', (data) => {
      data.commonMistakes = [
        {
          misconceptionId: 'MIS.BUG.TITLE_AREA_ONLY',
          descriptionHe: 'x',
          whyTempting: 'y',
          remediationRef: 'DOC-defects.EX.999',
        },
      ];
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('QM-16');
  });

  it('catches a misconception whose remediation target does not exist (QM-16)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'misconceptions/MIS.BUG.TITLE_AREA_ONLY.json', (data) => {
      data.remediationRef = 'DOC-defects.LE.404';
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('QM-16');
  });

  it('catches an approved blueprint that can never be assembled (EX-08)', async () => {
    // The rule that would have caught the readiness blueprint being approved
    // while five of its six question families had no items at all.
    const root = await libraryCopy();
    await mutate(root, 'exams/DOC-defects.BP.001.json', (data) => {
      const segments = data.segments as { questionFamily: string }[];
      segments[0]!.questionFamily = 'investigate_failure';
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('EX-08');
  });

  it('catches an approved blueprint whose segment budget no item can fit (EX-08)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exams/DOC-defects.BP.001.json', (data) => {
      const segments = data.segments as { minutes: number }[];
      // 20 minutes total is preserved so EX-03 still passes; the first segment
      // becomes too short for any real item, which is the condition under test.
      segments[0]!.minutes = 2;
      segments[1]!.minutes = 18;
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('EX-08');
  });

  it('does not apply EX-08 to a draft blueprint', async () => {
    // A draft blueprint is allowed to describe an exam the content cannot yet
    // satisfy — that is exactly how the readiness plan is parked.
    const root = await libraryCopy();
    await mutate(root, 'exams/DOC-defects.BP.001.json', (data) => {
      const segments = data.segments as { questionFamily: string }[];
      segments[0]!.questionFamily = 'investigate_failure';
      data.review = { status: 'draft' };
    });
    const { code, out } = await check(root);
    expect(out).not.toContain('EX-08');
    expect(code).toBe(0);
  });

  it('catches an exercise without a rubric (CM-08)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exercises/DOC-defects.EX.001.json', (d) => {
      d.rubricRef = 'RUB.DOES_NOT_EXIST';
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-08');
  });

  it('catches rubric weights that do not sum to 100 (QM-04)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'rubrics/RUB.BUG_REPORT.json', (d) => {
      const criteria = d.criteria as { weight: number }[];
      criteria[0]!.weight = 50;
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('QM-04');
  });

  it('catches a topic with fewer than two exercises (CM-28)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'topics/DOC-defects.json', (d) => {
      d.exerciseRefs = ['DOC-defects.EX.001'];
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-28');
  });

  it('catches an item linking to a topic that does not exist (CM-29)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exercises/DOC-defects.EX.001.json', (d) => {
      d.topic = 'DOC/no-such-topic';
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-29');
  });

  it('catches a question without a measured skill (QM-18)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exercises/DOC-defects.EX.001.json', (d) => {
      delete d.skills;
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('QM-18');
  });

  it('catches an exam blueprint over 20 minutes (EX-01)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exams/DOC-defects.BP.001.json', (d) => {
      d.durationMinutes = 25;
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('EX-01');
  });

  it('catches a question without a model answer (QM-09)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exercises/DOC-defects.EX.001.json', (d) => {
      delete d.modelAnswer;
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('QM-09');
  });

  it('catches an imported source without a licence status (SRC-01)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'sources/SRC-ITCB-CTFL-HE.json', (d) => {
      delete (d.licence as Record<string, unknown>).status;
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('SRC-01');
  });

  it('catches served content without a named professional approval (CM-30)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exercises/DOC-defects.EX.001.json', (d) => {
      d.review = { status: 'published' };
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-30');
  });

  it('catches a revision link to a missing item (QM-12)', async () => {
    const root = await libraryCopy();
    await mutate(root, 'exercises/DOC-defects.EX.001.json', (d) => {
      d.revisionRefs = ['DOC-defects.SUM.999'];
    });
    const { code, out } = await check(root);
    expect(code).not.toBe(0);
    expect(out).toContain('QM-12');
  });
});
