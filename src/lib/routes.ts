import type { TopicId } from '@/content/types';

/**
 * Every route in the application, in one place.
 *
 * Components link through these helpers rather than writing path strings, so
 * a route change is a single edit and a typo is a type error.
 */
export const routes = {
  home: '/',
  dashboard: '/dashboard',
  topics: '/topics',
  topic: (topicId: TopicId) => `/topics/${toTopicSlug(topicId)}`,
  practice: '/practice',
  exam: '/exam',
  progress: '/progress',
  admin: '/admin',
  adminContent: '/admin/content',
  adminRubrics: '/admin/rubrics',
  adminReview: '/admin/review',
} as const;

/**
 * Topic IDs contain a slash (`TD/black-box`, docs/03 §3), which cannot appear
 * in a single URL path segment. The slug replaces it with a hyphen — the same
 * transform docs/05 §4 already applies to content item IDs, so one convention
 * covers both filenames and URLs.
 *
 * The domain prefix is uppercase and slugs are lowercase, so the mapping back
 * is unambiguous: the first hyphen after the uppercase prefix is the slash.
 */
export function toTopicSlug(topicId: TopicId): string {
  return topicId.replace('/', '-');
}

export function fromTopicSlug(slug: string): TopicId {
  const match = /^([A-Z]{2,4})-(.+)$/.exec(slug);
  if (!match) return slug;
  return `${match[1]}/${match[2]}`;
}

/**
 * Whether `pathname` is inside `href`, for marking the active nav item.
 * The dashboard is matched exactly so that it is not highlighted on every page.
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === routes.home) return pathname === routes.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}
