import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ContentItem } from '@/content/types';
import { t } from '@/i18n';

/**
 * Admin content editing — the write half of the authoring surface.
 *
 * Editing an approved item's content forces its status back to `needs_update`
 * and bumps `version` (docs/05 §7, CM-14): an edit un-serves the item until a
 * named reviewer re-approves it. That is what "the admin can edit content
 * without a code change" means here — the file is the source of truth, and
 * the lifecycle is enforced at the only place that writes it.
 */

function contentRoot(): string {
  return process.env.ZIBI_CONTENT_ROOT ?? join(process.cwd(), 'content');
}

/** The directories that hold content items, in lookup order. */
const ITEM_DIRS = ['lessons', 'examples', 'exercises', 'exams'] as const;

/** Where a new item of a given type belongs. */
export function collectionForType(type: string): (typeof ITEM_DIRS)[number] {
  switch (type) {
    case 'summary':
    case 'lesson':
      return 'lessons';
    case 'guided_example':
      return 'examples';
    case 'exercise':
      return 'exercises';
    case 'exam_item':
    case 'exam_blueprint':
      return 'exams';
    default:
      return 'lessons';
  }
}

async function findItemPath(itemId: string): Promise<string | null> {
  // Item ids are validated before this is called; they never contain a path
  // separator, so the id is safe as a file name.
  for (const dir of ITEM_DIRS) {
    const candidate = join(contentRoot(), dir, `${itemId}.json`);
    try {
      await readFile(candidate, 'utf8');
      return candidate;
    } catch {
      // keep looking
    }
  }
  return null;
}

const ID_PATTERN = /^[A-Z]{2,4}-[a-z-]{2,24}\.[A-Z]{2,3}\.\d{3}$/;

export async function readItemRaw(itemId: string): Promise<string | null> {
  if (!ID_PATTERN.test(itemId)) return null;
  const path = await findItemPath(itemId);
  if (!path) return null;
  return readFile(path, 'utf8');
}

export interface SaveResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly newStatus?: string;
}

/** Structural checks that must hold for any item file. */
function validateItem(parsed: ContentItem, expectedId: string): string | null {
  if (parsed.id !== expectedId) return t.writer.idImmutable;
  if (!parsed.type) return t.writer.missingType;
  if (!parsed.title?.trim()) return t.writer.missingTitle;
  if (!Array.isArray(parsed.source) || parsed.source.length === 0)
    return t.writer.missingSource;
  if (!parsed.review?.status) return t.writer.missingReviewStatus;
  if (typeof parsed.version !== 'number') return t.writer.missingVersion;
  return null;
}

export async function saveItemEdit(
  itemId: string,
  rawJson: string,
): Promise<SaveResult> {
  if (!ID_PATTERN.test(itemId)) return { ok: false, error: t.writer.invalidId };

  let parsed: ContentItem;
  try {
    parsed = JSON.parse(rawJson) as ContentItem;
  } catch {
    return { ok: false, error: t.writer.invalidJson };
  }

  const structural = validateItem(parsed, itemId);
  if (structural) return { ok: false, error: structural };

  const path = await findItemPath(itemId);
  if (!path) return { ok: false, error: t.writer.notFound };
  const existing = JSON.parse(await readFile(path, 'utf8')) as ContentItem;

  // CM-14: a content-affecting edit to an approved item bumps the version and
  // resets the status. The editor cannot smuggle an approved status in with
  // the edit — approval is a separate, named act.
  const edited: ContentItem = {
    ...parsed,
    version: existing.version + 1,
    review: { status: 'needs_update' },
    updatedAt: new Date().toISOString().slice(0, 10),
  } as ContentItem;

  await writeFile(path, `${JSON.stringify(edited, null, 2)}\n`, 'utf8');
  return { ok: true, newStatus: 'needs_update' };
}

export async function approveItem(
  itemId: string,
  reviewerName: string,
): Promise<SaveResult> {
  if (!ID_PATTERN.test(itemId)) return { ok: false, error: t.writer.invalidId };
  const name = reviewerName.trim();
  if (!name) return { ok: false, error: t.writer.reviewerRequired };

  const path = await findItemPath(itemId);
  if (!path) return { ok: false, error: t.writer.notFound };
  const existing = JSON.parse(await readFile(path, 'utf8')) as ContentItem;

  const approved: ContentItem = {
    ...existing,
    review: {
      status: 'approved',
      reviewedBy: name,
      reviewedAt: new Date().toISOString().slice(0, 10),
    },
  };

  await writeFile(path, `${JSON.stringify(approved, null, 2)}\n`, 'utf8');
  return { ok: true, newStatus: 'approved' };
}

/**
 * The final pipeline gate: publication. Requires the item to already be
 * `approved` (the professional review), then runs the structural validator
 * over the whole library and refuses to publish while it fails — that is the
 * בדיקת מבנה step of the pipeline, mechanically.
 */
export async function publishItem(itemId: string): Promise<SaveResult> {
  if (!ID_PATTERN.test(itemId)) return { ok: false, error: t.writer.invalidId };
  const path = await findItemPath(itemId);
  if (!path) return { ok: false, error: t.writer.notFound };
  const existing = JSON.parse(await readFile(path, 'utf8')) as ContentItem;

  if (existing.review?.status !== 'approved') {
    return { ok: false, error: t.writer.approvalRequired };
  }

  const structural = await runStructuralValidation();
  if (!structural.ok) {
    return { ok: false, error: t.writer.structuralFailed(structural.firstError ?? '') };
  }

  const published: ContentItem = {
    ...existing,
    review: { ...existing.review, status: 'published' },
  };
  await writeFile(path, `${JSON.stringify(published, null, 2)}\n`, 'utf8');
  return { ok: true, newStatus: 'published' };
}

async function runStructuralValidation(): Promise<{ ok: boolean; firstError?: string }> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  try {
    await run(process.execPath, [join(process.cwd(), 'scripts', 'validate-content.mjs')], {
      env: { ...process.env },
    });
    return { ok: true };
  } catch (error) {
    const err = error as { stderr?: string };
    const firstError = (err.stderr ?? '').split('\n').find((l) => l.trim().startsWith('CM') || l.trim().startsWith('QM') || l.trim().startsWith('SRC') || l.trim().startsWith('EX-') || l.trim().startsWith('SM'));
    return { ok: false, firstError: firstError?.trim() ?? t.writer.seeValidatorOutput };
  }
}
