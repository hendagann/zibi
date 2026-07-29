import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RubricDoc } from '@/scoring/types';
import type {
  ContentItem,
  ContentItemId,
  Domain,
  Skill,
  Topic,
  TopicId,
} from './types';

/**
 * Content loader.
 *
 * Reads authored data from the repository's `content/` directory. This is the
 * only place content enters the application; components receive the result as
 * props and never read files themselves (docs/05 §2).
 *
 * Two behaviours are deliberate and must not be "improved" later:
 *
 * 1. **It returns nothing when there is nothing.** `content/` is empty in
 *    Phase 1, so every accessor returns an empty collection and every page
 *    renders its empty state. There is no placeholder data anywhere in this
 *    module. CLAUDE.md forbids mock data in production flows, and an empty
 *    result is the honest representation of an empty repository.
 *
 * 2. **Only `approved` items are served.** Draft and in-review content exists
 *    for authors, never for learners (docs/05 §7). Filtering happens here, at
 *    the loader, so that no component can accidentally render unapproved
 *    material.
 */

/**
 * Overridable for tests only. Loader tests must be able to point at a fixture
 * library containing draft items and prove they are filtered out — without
 * this the approved-only rule (docs/05 §7) would be untestable, and the tests
 * asserting empty results could not tell an empty library from a loader that
 * throws everything away.
 */
const CONTENT_ROOT =
  process.env.ZIBI_CONTENT_ROOT ?? join(process.cwd(), 'content');

type Collection = 'domains' | 'topics' | 'skills' | 'items' | 'rubrics' | 'sources';

async function readCollection<T>(collection: Collection): Promise<T[]> {
  const dir = join(CONTENT_ROOT, collection);

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    // The directory does not exist yet. That is the Phase 1 state, and it is
    // not an error — it is an empty library.
    return [];
  }

  const files = entries.filter((name) => name.endsWith('.json'));
  const parsed: T[] = [];

  for (const file of files) {
    const raw = await readFile(join(dir, file), 'utf8');
    parsed.push(JSON.parse(raw) as T);
  }

  return parsed;
}

function isServable(item: { review?: { status?: string } }): boolean {
  return item.review?.status === 'approved';
}

export async function getDomains(): Promise<Domain[]> {
  const domains = await readCollection<Domain>('domains');
  return domains
    .filter((d) => d.status === 'active')
    .sort((a, b) => a.order - b.order);
}

export async function getTopics(): Promise<Topic[]> {
  const topics = await readCollection<Topic>('topics');
  return topics.filter(isServable);
}

export async function getTopic(id: TopicId): Promise<Topic | null> {
  const topics = await getTopics();
  return topics.find((topic) => topic.id === id) ?? null;
}

export async function getSkills(): Promise<Skill[]> {
  const skills = await readCollection<Skill>('skills');
  return skills.filter((s) => s.status === 'active');
}

export async function getSkillsForTopic(topicId: TopicId): Promise<Skill[]> {
  const skills = await getSkills();
  return skills.filter((skill) => skill.topic === topicId);
}

export async function getItems(): Promise<ContentItem[]> {
  const items = await readCollection<ContentItem>('items');
  return items.filter((item) => item.status === 'active').filter(isServable);
}

export async function getItemsByIds(
  ids: readonly ContentItemId[],
): Promise<ContentItem[]> {
  if (ids.length === 0) return [];
  const wanted = new Set(ids);
  const items = await getItems();
  return items.filter((item) => wanted.has(item.id));
}

/** Practice-pool exercises. Empty until content is authored. */
export async function getPracticeExercises(): Promise<ContentItem[]> {
  const items = await getItems();
  return items.filter((item) => item.type === 'exercise' && item.pool === 'practice');
}

/** Exam-pool items. Never drawn from the practice pool (docs/05 §14). */
export async function getExamItems(): Promise<ContentItem[]> {
  const items = await getItems();
  return items.filter((item) => item.type === 'exam_item' && item.pool === 'exam');
}

export async function getItem(id: ContentItemId): Promise<ContentItem | null> {
  const items = await getItems();
  return items.find((item) => item.id === id) ?? null;
}

/**
 * Rubrics have their own lifecycle (docs/07 §15): only `active` may score a
 * new evaluation, so that is all this accessor returns.
 */
export async function getActiveRubric(rubricId: string): Promise<RubricDoc | null> {
  const rubrics = await readCollection<RubricDoc>('rubrics');
  return (
    rubrics.find((r) => r.rubric_id === rubricId && r.status === 'active') ?? null
  );
}

/**
 * Authoring surface ONLY. Returns every item regardless of review status, so
 * the admin area can list drafts and needs_update items. Nothing rendered to
 * a learner may come from here — learner surfaces go through getItems().
 */
export async function getAllItemsForAdmin(): Promise<ContentItem[]> {
  return readCollection<ContentItem>('items');
}

export async function getAllTopicsForAdmin(): Promise<Topic[]> {
  return readCollection<Topic>('topics');
}
