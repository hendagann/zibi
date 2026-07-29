#!/usr/bin/env node
/**
 * Content import — the entry point of the content pipeline.
 *
 *   חומר מחקרי → הערות → טיוטה → בדיקה מקצועית → בדיקת מבנה → פרסום
 *   ^^^^^^^^^^^^^^^^^^^^^^^^^^^ this tool covers the arrow into the library
 *
 * Usage:
 *   node scripts/import-content.mjs <bundle.json> [--update]
 *
 * The bundle is one JSON file holding any of: domains, topics, skills,
 * sources, rubrics, items. The tool normalises each entity into its file in
 * content/ — one file per entity, named by id — so authored material (human
 * or AI-drafted) enters the library without hand-placing files.
 *
 * Two rules are enforced and cannot be bypassed from a bundle:
 *
 * 1. **No imported approval.** Whatever status a bundle claims, an imported
 *    item lands as `draft`, `ai_generated`, or `needs_professional_review`
 *    (anything else is coerced to the latter, and reviewer fields are
 *    stripped). Approval and publication are named acts performed in the
 *    system — see contentWriter — never properties of incoming data.
 *
 * 2. **No silent overwrite.** An id that already exists is refused unless
 *    `--update` is passed, and an update bumps the version and resets the
 *    status exactly like an admin edit (CM-14).
 *
 * The structural validator runs at the end in REPORT mode: drafts are allowed
 * to be incomplete, so findings are printed as warnings and the import still
 * lands. The hard gate is publication (contentWriter.publishItem), not entry.
 */

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';

const run = promisify(execFile);
const ROOT = process.env.ZIBI_CONTENT_ROOT ?? join(process.cwd(), 'content');

const [, , bundlePath, ...flags] = process.argv;
const UPDATE = flags.includes('--update');

if (!bundlePath) {
  console.error('שימוש: node scripts/import-content.mjs <bundle.json> [--update]');
  process.exit(2);
}

const INCOMING_STATUSES = new Set(['draft', 'ai_generated', 'needs_professional_review']);
const ITEM_DIR = {
  summary: 'lessons', lesson: 'lessons', guided_example: 'examples',
  exercise: 'exercises', exam_item: 'exams', exam_blueprint: 'exams',
};
const ID_PATTERNS = {
  item: /^[A-Z]{2,4}-[a-z-]{2,24}\.[A-Z]{2,3}\.\d{3}$/,
  topic: /^[A-Z]{2,4}\/[a-z-]{2,24}$/,
  skill: /^[A-Z]{2,4}\.[A-Z0-9]{2,8}$/,
  domain: /^[A-Z]{2,4}$/,
  rubric: /^RUB\.[A-Z0-9_]{3,24}$/,
  source: /^SRC-[A-Z0-9-]{3,32}$/,
};

let bundle;
try {
  bundle = JSON.parse(await readFile(bundlePath, 'utf8'));
} catch (error) {
  console.error(`קובץ הצרור לא נקרא: ${error.message}`);
  process.exit(2);
}

const report = { written: [], updated: [], refused: [], coerced: [] };

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function writeEntity(dir, id, entity) {
  const file = join(ROOT, dir, `${id.replace('/', '-')}.json`);
  await mkdir(join(ROOT, dir), { recursive: true });

  if (await exists(file)) {
    if (!UPDATE) {
      report.refused.push(`${id} — קיים; הריצו עם --update לעדכון`);
      return;
    }
    const existing = JSON.parse(await readFile(file, 'utf8'));
    entity.version = (existing.version ?? 0) + 1;
    report.updated.push(id);
  } else {
    entity.version ??= 1;
    report.written.push(id);
  }
  await writeFile(file, `${JSON.stringify(entity, null, 2)}\n`, 'utf8');
}

function coerceReview(entity, id) {
  const incoming = entity.review?.status ?? 'draft';
  const status = INCOMING_STATUSES.has(incoming) ? incoming : 'needs_professional_review';
  if (status !== incoming) report.coerced.push(`${id}: ${incoming} → ${status}`);
  // Reviewer identity never arrives by import — approval is a named act here.
  entity.review = { status };
  return entity;
}

for (const domain of bundle.domains ?? []) {
  if (!ID_PATTERNS.domain.test(domain.id ?? '')) { report.refused.push(`domain ${domain.id}: מזהה לא חוקי`); continue; }
  await writeEntity('domains', domain.id, domain);
}
for (const skill of bundle.skills ?? []) {
  if (!ID_PATTERNS.skill.test(skill.id ?? '')) { report.refused.push(`skill ${skill.id}: מזהה לא חוקי`); continue; }
  await writeEntity('skills', skill.id, skill);
}
for (const source of bundle.sources ?? []) {
  if (!ID_PATTERNS.source.test(source.id ?? '')) { report.refused.push(`source ${source.id}: מזהה לא חוקי`); continue; }
  if (source.imported && !source.licence?.status) {
    report.refused.push(`source ${source.id}: מקור מיובא בלי מצב רישיון (SRC-01)`);
    continue;
  }
  await writeEntity('sources', source.id, source);
}
for (const rubric of bundle.rubrics ?? []) {
  if (!ID_PATTERNS.rubric.test(rubric.rubric_id ?? '')) { report.refused.push(`rubric ${rubric.rubric_id}: מזהה לא חוקי`); continue; }
  // A rubric cannot arrive active: activation follows review (docs/07 §15).
  if (rubric.status === 'active' || rubric.status === 'approved') {
    report.coerced.push(`${rubric.rubric_id}: ${rubric.status} → needs_review`);
    rubric.status = 'needs_review';
  }
  await writeEntity('rubrics', rubric.rubric_id, rubric);
}
for (const topic of bundle.topics ?? []) {
  if (!ID_PATTERNS.topic.test(topic.id ?? '')) { report.refused.push(`topic ${topic.id}: מזהה לא חוקי`); continue; }
  await writeEntity('topics', topic.id, coerceReview(topic, topic.id));
}
for (const item of bundle.items ?? []) {
  if (!ID_PATTERNS.item.test(item.id ?? '')) { report.refused.push(`item ${item.id}: מזהה לא חוקי`); continue; }
  const dir = ITEM_DIR[item.type];
  if (!dir) { report.refused.push(`item ${item.id}: type לא מוכר: ${item.type}`); continue; }
  item.status ??= 'active';
  await writeEntity(dir, item.id, coerceReview(item, item.id));
}

console.log(`\nיובאו: ${report.written.length} · עודכנו: ${report.updated.length} · נדחו: ${report.refused.length}`);
for (const id of report.written) console.log(`  + ${id}`);
for (const id of report.updated) console.log(`  ~ ${id}`);
for (const line of report.coerced) console.log(`  סטטוס: ${line}`);
for (const line of report.refused) console.log(`  ✗ ${line}`);

// Structural validation in report mode: drafts may be incomplete, so findings
// are warnings here. Publication is where structure blocks.
try {
  await run(process.execPath, [join(process.cwd(), 'scripts', 'validate-content.mjs')], {
    env: { ...process.env },
  });
  console.log('\nבדיקת מבנה: תקין.');
} catch (error) {
  console.log('\nבדיקת מבנה — ממצאים (לא חוסמים ייבוא; חוסמים פרסום):');
  console.log(error.stderr ?? error.stdout ?? '');
}

process.exit(report.refused.length > 0 ? 1 : 0);
