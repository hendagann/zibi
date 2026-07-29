import { describe, expect, it } from 'vitest';
import {
  getDomains,
  getExamItems,
  getItems,
  getPracticeExercises,
  getSkills,
  getTopic,
  getTopics,
} from './loader';

/**
 * The loader is the boundary that keeps the shell honest. With no authored
 * content it must return nothing — never a sample, never a placeholder.
 * CLAUDE.md forbids mock data in production flows, and these tests are what
 * stop it being introduced later "just to see the layout".
 */
describe('content loader with an empty library', () => {
  it('returns no domains', async () => {
    await expect(getDomains()).resolves.toEqual([]);
  });

  it('returns no topics', async () => {
    await expect(getTopics()).resolves.toEqual([]);
  });

  it('returns no skills', async () => {
    await expect(getSkills()).resolves.toEqual([]);
  });

  it('returns no items', async () => {
    await expect(getItems()).resolves.toEqual([]);
  });

  it('resolves a missing topic to null rather than throwing', async () => {
    await expect(getTopic('TD/black-box')).resolves.toBeNull();
  });

  it('keeps the practice and exam pools separate and both empty', async () => {
    await expect(getPracticeExercises()).resolves.toEqual([]);
    await expect(getExamItems()).resolves.toEqual([]);
  });
});
