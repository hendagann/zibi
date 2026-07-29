import { describe, expect, it } from 'vitest';
import { fromTopicSlug, isActiveRoute, routes, toTopicSlug } from './routes';

describe('topic slugs', () => {
  it('replaces the slash so a topic id fits one URL segment', () => {
    expect(toTopicSlug('TD/black-box')).toBe('TD-black-box');
    expect(toTopicSlug('TECH/quality-attributes')).toBe(
      'TECH-quality-attributes',
    );
  });

  it('round-trips every topic id shape used in docs/03', () => {
    const ids = [
      'FUND/purpose',
      'LIFE/levels-types',
      'TD/black-box',
      'TD/experience-based',
      'MGMT/infrastructure',
      'DOC/design-artifacts',
      'TECH/quality-attributes',
      'TECH/ai',
    ];
    for (const id of ids) {
      expect(fromTopicSlug(toTopicSlug(id))).toBe(id);
    }
  });

  it('keeps hyphens inside the slug intact', () => {
    // Only the first hyphen after the uppercase prefix is the slash.
    expect(fromTopicSlug('LIFE-levels-types')).toBe('LIFE/levels-types');
  });

  it('returns an unrecognised slug unchanged rather than corrupting it', () => {
    expect(fromTopicSlug('not-a-topic')).toBe('not-a-topic');
  });

  it('builds a topic route from an id', () => {
    expect(routes.topic('TD/black-box')).toBe('/topics/TD-black-box');
  });
});

describe('isActiveRoute', () => {
  it('matches an exact path', () => {
    expect(isActiveRoute('/practice', '/practice')).toBe(true);
  });

  it('matches a nested path', () => {
    expect(isActiveRoute('/topics/TD-black-box', '/topics')).toBe(true);
  });

  it('does not match a sibling with a shared prefix', () => {
    expect(isActiveRoute('/topicsomething', '/topics')).toBe(false);
  });

  it('matches the root only exactly', () => {
    expect(isActiveRoute('/', '/')).toBe(true);
    expect(isActiveRoute('/dashboard', '/')).toBe(false);
  });
});
