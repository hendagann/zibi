#!/usr/bin/env node
/**
 * Content validation — the enforceable subset of docs/05 §17 and docs/07,
 * run against the real library on every verify.
 *
 * Structural rules only: JSON-shape truths a script can decide. Behavioural
 * rules (a model answer scoring 100, the engine's determinism) live in the
 * vitest suite, which can execute the scoring engine.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.env.ZIBI_CONTENT_ROOT ?? join(process.cwd(), 'content');
const errors = [];
const fail = (rule, msg) => errors.push(`${rule}  ${msg}`);

async function readAll(dir) {
  try {
    const files = (await readdir(join(ROOT, dir))).filter((f) => f.endsWith('.json'));
    const out = [];
    for (const f of files) {
      const raw = await readFile(join(ROOT, dir, f), 'utf8');
      try {
        out.push({ file: `${dir}/${f}`, data: JSON.parse(raw) });
      } catch {
        fail('CM-01', `${dir}/${f}: JSON לא תקין`);
      }
    }
    return out;
  } catch {
    return [];
  }
}

const [domains, topics, skills, items, rubrics, sources] = await Promise.all(
  ['domains', 'topics', 'skills', 'items', 'rubrics', 'sources'].map(readAll),
);

const itemById = new Map(items.map((i) => [i.data.id, i.data]));
const skillIds = new Set(skills.map((s) => s.data.id));
const sourceIds = new Set(sources.map((s) => s.data.id));
const rubricIds = new Set(rubrics.map((r) => r.data.rubric_id));
const domainIds = new Set(domains.map((d) => d.data.id));

/* ---- CM-02: id pattern, uniqueness, type-code agreement ---- */
const TYPE_CODE = {
  summary: 'SUM', lesson: 'LE', guided_example: 'GE',
  exercise: 'EX', exam_item: 'XM', checklist: 'CL', exam_blueprint: 'BP',
};
const seen = new Set();
for (const { file, data } of items) {
  const id = data.id ?? '';
  if (!/^[A-Z]{2,4}-[a-z-]{2,24}\.[A-Z]{2,3}\.\d{3}$/.test(id))
    fail('CM-02', `${file}: מזהה לא תואם תבנית: ${id}`);
  if (seen.has(id)) fail('CM-02', `${file}: מזהה כפול: ${id}`);
  seen.add(id);
  const code = id.split('.')[1];
  if (TYPE_CODE[data.type] && code !== TYPE_CODE[data.type])
    fail('CM-02', `${file}: קוד סוג ${code} לא תואם type=${data.type}`);
  if (id.replace('/', '-') !== `${file.replace('items/', '').replace('.json', '')}`)
    fail('CM-02', `${file}: שם הקובץ אינו המזהה`);
}

/* ---- CM-03/04/05/06: envelope references ---- */
for (const { file, data } of items) {
  if (data.type === 'exam_blueprint') continue;
  if (data.skills?.primary && !skillIds.has(data.skills.primary))
    fail('CM-03', `${file}: מיומנות ראשית לא קיימת: ${data.skills.primary}`);
  for (const src of data.source ?? [])
    if (!sourceIds.has(src.sourceId)) fail('CM-05', `${file}: מקור לא רשום: ${src.sourceId}`);
  if ((data.source ?? []).length === 0) fail('CM-05', `${file}: חסר מקור`);
  if (!data.review?.status) fail('CM-06', `${file}: חסר סטטוס בדיקה`);
  if (src_quoted_uncleared(data)) fail('CM-07', `${file}: ציטוט ללא אישור רישוי`);
}
function src_quoted_uncleared(data) {
  return (data.source ?? []).some((s) => s.derivation === 'quoted' && s.licenceCleared !== true);
}

/* ---- topics: CM-17/25 + refs resolve + domain agreement ---- */
for (const { file, data } of topics) {
  if (!domainIds.has(data.domain)) fail('CM-03', `${file}: תחום לא קיים: ${data.domain}`);
  if (data.id?.split('/')[0] !== data.domain)
    fail('CM-02', `${file}: קידומת המזהה לא תואמת את התחום`);
  if (!data.summaryRef) fail('CM-25', `${file}: לנושא אין דף סיכום`);
  if (!Array.isArray(data.lessonRefs) || data.lessonRefs.length === 0)
    fail('CM-25', `${file}: לנושא אין שיעורים`);
  for (const ref of [data.summaryRef, ...(data.lessonRefs ?? []), ...(data.exerciseRefs ?? [])]) {
    if (ref && !itemById.has(ref)) fail('CM-03', `${file}: הפניה לפריט שאינו קיים: ${ref}`);
  }
  if (data.review?.status === 'approved') {
    for (const ref of [data.summaryRef, ...(data.lessonRefs ?? []), ...(data.exerciseRefs ?? [])]) {
      const target = ref && itemById.get(ref);
      if (target && target.review?.status !== 'approved')
        fail('CM-17', `${file}: נושא מאושר מפנה לפריט לא מאושר: ${ref}`);
    }
  }
  for (const skillId of data.measuredSkills ?? [])
    if (!skillIds.has(skillId)) fail('CM-03', `${file}: מיומנות נמדדת לא קיימת: ${skillId}`);
}

/* ---- CM-22: every lesson has ≥2 guided examples that point back at it ---- */
for (const { file, data } of items.filter((i) => i.data.type === 'lesson')) {
  const ge = data.guidedExamples ?? [];
  if (ge.length < 2) fail('CM-22', `${file}: לשיעור פחות משתי דוגמאות מודרכות`);
  for (const ref of ge) {
    const target = itemById.get(ref);
    if (!target) fail('CM-22', `${file}: דוגמה לא קיימת: ${ref}`);
    else if (target.lesson !== data.id)
      fail('CM-22', `${file}: הדוגמה ${ref} אינה מצביעה חזרה על השיעור`);
  }
}

/* ---- CM-15: summary budget (chars + 80/table-row, 2400/page, 2 pages) ---- */
for (const { file, data } of items.filter((i) => i.data.type === 'summary')) {
  let units = 0;
  for (const block of data.body ?? []) {
    if (block.text) units += block.text.length;
    if (block.items) units += block.items.join('').length;
    if (block.rows) units += 80 * (block.rows.length + 1);
  }
  if (units > 4800) fail('CM-15', `${file}: סיכום חורג מהתקציב (${units}/4800)`);
}

/* ---- scored items: CM-08/09, QM-12 ---- */
for (const { file, data } of items.filter((i) => ['exercise', 'exam_item'].includes(i.data.type))) {
  if (!data.pool) fail('CM-09', `${file}: חסר pool`);
  if (data.type === 'exercise' && data.pool !== 'practice')
    fail('CM-09', `${file}: exercise חייב להיות ב-pool practice`);
  if (data.type === 'exam_item' && data.pool !== 'exam')
    fail('CM-09', `${file}: exam_item חייב להיות ב-pool exam`);
  if (!data.rubricRef || !rubricIds.has(data.rubricRef))
    fail('CM-08', `${file}: מחוון לא קיים: ${data.rubricRef}`);
  if (!Array.isArray(data.revisionRefs) || data.revisionRefs.length === 0)
    fail('QM-12', `${file}: אין קישורי חזרה`);
  for (const ref of data.revisionRefs ?? []) {
    const target = itemById.get(ref);
    if (!target) fail('QM-12', `${file}: קישור חזרה לפריט לא קיים: ${ref}`);
    else if (target.review?.status !== 'approved')
      fail('QM-12', `${file}: קישור חזרה לפריט לא מאושר: ${ref}`);
  }
  if (!data.modelAnswer) fail('QM-09', `${file}: חסרה תשובת מופת`);
}

/* ---- rubrics: weights sum 100, criterion integrity, remediation resolves ---- */
for (const { file, data } of rubrics) {
  const sum = (data.criteria ?? []).reduce((s, c) => s + (c.weight ?? 0), 0);
  if (sum !== 100) fail('QM-04', `${file}: משקלים מסתכמים ל-${sum}`);
  for (const criterion of data.criteria ?? []) {
    if (criterion.weight !== criterion.max_points)
      fail('QM-04', `${file}/${criterion.criterion_id}: weight≠max_points`);
    const musts = (criterion.expected_components ?? []).filter((c) => c.class === 'must');
    if (musts.length === 0)
      fail('QM-13', `${file}/${criterion.criterion_id}: אין רכיב חובה`);
    for (const skillId of criterion.skill_ids ?? [])
      if (!skillIds.has(skillId))
        fail('SM-03', `${file}/${criterion.criterion_id}: מיומנות לא קיימת: ${skillId}`);
    if (criterion.remediation?.ref && !itemById.has(criterion.remediation.ref))
      fail('QM-16', `${file}/${criterion.criterion_id}: יעד חזרה לא קיים: ${criterion.remediation.ref}`);
    for (const field of ['full_examples', 'partial_examples', 'missing_examples'])
      if (!Array.isArray(criterion[field]))
        fail('QM-14', `${file}/${criterion.criterion_id}: חסר ${field}`);
  }
  if (data.status === 'active' && !data.approved_by)
    fail('QM-03', `${file}: מחוון active ללא approved_by`);
}

/* ---- skills referenced by rubric criteria that belong to other topics are
        allowed (docs/03: prerequisites cross topics), but must exist when the
        skill is a topic's own measured skill — covered above. ---- */

if (errors.length) {
  console.error(`\nContent validation failed (${errors.length}):\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(
  `Content OK — ${domains.length} domains, ${topics.length} topics, ${skills.length} skills, ${items.length} items, ${rubrics.length} rubrics, ${sources.length} sources.`,
);
