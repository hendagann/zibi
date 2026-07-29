import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const SCRIPT = join(process.cwd(), 'scripts', 'check-content-boundary.mjs');

/**
 * The boundary checker is the only mechanical enforcement of docs/05 §2. A
 * checker that silently stops catching things is worse than no checker, so it
 * is tested against fixtures that must fail and fixtures that must pass.
 */
const created: string[] = [];

async function fixture(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'boundary-'));
  created.push(dir);
  for (const [relPath, contents] of Object.entries(files)) {
    const full = join(dir, relPath);
    await mkdir(join(full, '..'), { recursive: true });
    await writeFile(full, contents, 'utf8');
  }
  return dir;
}

async function check(cwd: string): Promise<{ code: number; out: string }> {
  try {
    const { stdout } = await run(process.execPath, [SCRIPT], { cwd });
    return { code: 0, out: stdout };
  } catch (error) {
    const err = error as { code?: number; stderr?: string; stdout?: string };
    return { code: err.code ?? 1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

afterEach(async () => {
  await Promise.all(created.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('content boundary checker', () => {
  it('passes a clean tree', async () => {
    const dir = await fixture({
      'src/components/Thing.tsx': `import { t } from '@/i18n';\nexport const Thing = () => <p>{t.nav.dashboard}</p>;\n`,
      'src/i18n/he.ts': `export const he = { nav: { dashboard: 'לוח בקרה' } };\n`,
    });
    const { code } = await check(dir);
    expect(code).toBe(0);
  });

  it('catches Hebrew outside the dictionary (CM-20)', async () => {
    const dir = await fixture({
      'src/components/Thing.tsx': `export const Thing = () => <p>שלום</p>;\n`,
    });
    const { code, out } = await check(dir);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-20');
  });

  it('allows Hebrew inside src/i18n', async () => {
    const dir = await fixture({
      'src/i18n/he.ts': `export const he = { a: 'שלום' };\n`,
    });
    const { code } = await check(dir);
    expect(code).toBe(0);
  });

  it('ignores Hebrew inside comments', async () => {
    const dir = await fixture({
      'src/components/Thing.tsx': `// דוגמה בהערה בלבד\n/* גם כאן */\nexport const Thing = () => null;\n`,
    });
    const { code } = await check(dir);
    expect(code).toBe(0);
  });

  it('is not blinded by a /* inside a string literal', async () => {
    // A naive comment-stripping regex would delete from the '/*' in the
    // string to the next '*/' anywhere below it — hiding the Hebrew that
    // follows. The scanner must treat comment markers inside strings as data.
    const dir = await fixture({
      'src/components/Thing.tsx': [
        `const glob = 'src/**' + '/*';`,
        `export const Thing = () => <p>טקסט עברי שאסור לפספס</p>;`,
        `// */`,
        ``,
      ].join('\n'),
    });
    const { code, out } = await check(dir);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-20');
  });

  it('catches a slash-separated topic id in a conditional (CM-21)', async () => {
    // The separator that a previous ESLint selector missed.
    const dir = await fixture({
      'src/components/Thing.tsx': `export const f = (id: string) => { if (id === 'TD/black-box') { return 1; } return 0; };\n`,
    });
    const { code, out } = await check(dir);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-21');
  });

  it('catches a dotted skill id in a conditional (CM-21)', async () => {
    const dir = await fixture({
      'src/components/Thing.tsx': `export const f = (id: string) => (id === 'TD.BVA' ? 1 : 0);\n`,
    });
    const { code, out } = await check(dir);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-21');
  });

  it('catches a hyphenated content item id in a conditional (CM-21)', async () => {
    const dir = await fixture({
      'src/components/Thing.tsx': `export const f = (id: string) => { if (id === 'TD-black-box.EX.001') { return 1; } return 0; };\n`,
    });
    const { code, out } = await check(dir);
    expect(code).not.toBe(0);
    expect(out).toContain('CM-21');
  });
});
