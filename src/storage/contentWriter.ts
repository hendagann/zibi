import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ContentItem } from '@/content/types';

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

function itemPath(itemId: string): string {
  // Item ids are validated before this is called; they never contain a path
  // separator, so the id is safe as a file name.
  return join(contentRoot(), 'items', `${itemId}.json`);
}

const ID_PATTERN = /^[A-Z]{2,4}-[a-z-]{2,24}\.[A-Z]{2,3}\.\d{3}$/;

export async function readItemRaw(itemId: string): Promise<string | null> {
  if (!ID_PATTERN.test(itemId)) return null;
  try {
    return await readFile(itemPath(itemId), 'utf8');
  } catch {
    return null;
  }
}

export interface SaveResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly newStatus?: string;
}

/** Structural checks that must hold for any item file. */
function validateItem(parsed: ContentItem, expectedId: string): string | null {
  if (parsed.id !== expectedId) return 'אסור לשנות את מזהה הפריט';
  if (!parsed.type) return 'חסר שדה type';
  if (!parsed.title?.trim()) return 'חסרה כותרת';
  if (!Array.isArray(parsed.source) || parsed.source.length === 0)
    return 'כל פריט חייב לציין מקור (docs/05 §6)';
  if (!parsed.review?.status) return 'חסר סטטוס בדיקה';
  if (typeof parsed.version !== 'number') return 'חסר מספר גרסה';
  return null;
}

export async function saveItemEdit(
  itemId: string,
  rawJson: string,
): Promise<SaveResult> {
  if (!ID_PATTERN.test(itemId)) return { ok: false, error: 'מזהה פריט לא חוקי' };

  let parsed: ContentItem;
  try {
    parsed = JSON.parse(rawJson) as ContentItem;
  } catch {
    return { ok: false, error: 'JSON לא תקין' };
  }

  const structural = validateItem(parsed, itemId);
  if (structural) return { ok: false, error: structural };

  const existingRaw = await readItemRaw(itemId);
  if (!existingRaw) return { ok: false, error: 'הפריט לא נמצא' };
  const existing = JSON.parse(existingRaw) as ContentItem;

  // CM-14: a content-affecting edit to an approved item bumps the version and
  // resets the status. The editor cannot smuggle an "approved" status in with
  // the edit — approval is a separate, named act.
  const edited: ContentItem = {
    ...parsed,
    version: existing.version + 1,
    review: { status: 'needs_update' },
    updatedAt: new Date().toISOString().slice(0, 10),
  } as ContentItem;

  await writeFile(itemPath(itemId), `${JSON.stringify(edited, null, 2)}\n`, 'utf8');
  return { ok: true, newStatus: 'needs_update' };
}

export async function approveItem(
  itemId: string,
  reviewerName: string,
): Promise<SaveResult> {
  if (!ID_PATTERN.test(itemId)) return { ok: false, error: 'מזהה פריט לא חוקי' };
  const name = reviewerName.trim();
  if (!name) return { ok: false, error: 'אישור דורש שם בודקת (docs/05 §7)' };

  const existingRaw = await readItemRaw(itemId);
  if (!existingRaw) return { ok: false, error: 'הפריט לא נמצא' };
  const existing = JSON.parse(existingRaw) as ContentItem;

  const approved: ContentItem = {
    ...existing,
    review: {
      status: 'approved',
      reviewedBy: name,
      reviewedAt: new Date().toISOString().slice(0, 10),
    },
  };

  await writeFile(itemPath(itemId), `${JSON.stringify(approved, null, 2)}\n`, 'utf8');
  return { ok: true, newStatus: 'approved' };
}
