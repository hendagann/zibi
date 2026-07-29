import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = join(process.cwd(), 'src', 'app');

async function exists(...segments: string[]): Promise<boolean> {
  const dir = join(APP, ...segments.slice(0, -1));
  const file = segments[segments.length - 1];
  try {
    const entries = await readdir(dir);
    return entries.includes(file as string);
  } catch {
    return false;
  }
}

/**
 * Guards a routing constraint that is invisible in the source and only shows
 * up as a wrong HTTP status.
 *
 * `loading.tsx` wraps its segment *and every descendant* in Suspense. Next
 * then streams the shell — committing a 200 — before the page component runs.
 * A page that calls `notFound()` below such a boundary therefore returns 200
 * with not-found content: a soft 404.
 *
 * `/topics/[topicSlug]` is the only route that can legitimately 404, so no
 * loading boundary may sit at or above it. Verified against a production
 * server: with `(app)/loading.tsx` present the route returned 200; without it,
 * 404.
 */
describe('route structure', () => {
  it('has no loading boundary above the topic route', async () => {
    expect(await exists('(app)', 'loading.tsx')).toBe(false);
    expect(await exists('(app)', 'topics', 'loading.tsx')).toBe(false);
    expect(await exists('(app)', 'topics', '[topicSlug]', 'loading.tsx')).toBe(
      false,
    );
  });

  it('keeps a loading boundary on every route that cannot 404', async () => {
    for (const segment of [
      'dashboard',
      'practice',
      'exam',
      'progress',
      'admin',
    ]) {
      expect(await exists('(app)', segment, 'loading.tsx')).toBe(true);
    }
  });

  it('has an error boundary covering the whole shell', async () => {
    expect(await exists('(app)', 'error.tsx')).toBe(true);
    expect(await exists('global-error.tsx')).toBe(true);
  });

  it('has a not-found page at the root and for topics', async () => {
    expect(await exists('not-found.tsx')).toBe(true);
    expect(
      await exists('(app)', 'topics', '[topicSlug]', 'not-found.tsx'),
    ).toBe(true);
  });
});
