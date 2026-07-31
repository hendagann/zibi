import { describe, expect, it } from 'vitest';
import { resultsMatch, safetyCheck, type SqlRunResult } from './executor';

/**
 * `resultsMatch` decides every SQL score in the product and had no tests at
 * all. Its correctness rests on a single separator character that is invisible
 * in source, which is exactly the kind of thing that survives review and then
 * quietly breaks. These tests pin the behaviour so the character cannot be
 * removed or "tidied away" without a failure.
 */

function ok(
  columns: readonly string[],
  rows: readonly (readonly unknown[])[],
): SqlRunResult {
  return {
    ok: true,
    columns,
    rows,
    truncated: false,
    errorCode: null,
    errorHe: null,
    timedOut: false,
    unsafe: false,
  };
}

describe('resultsMatch — cell boundaries', () => {
  it('does not confuse two rows whose cells concatenate to the same text', () => {
    // The regression this guards: with no separator both rows normalise to
    // 'abc', a wrong query matches the reference, and it scores 100.
    const actual = ok(['a', 'b'], [['ab', 'c']]);
    const expected = ok(['a', 'b'], [['a', 'bc']]);
    expect(resultsMatch(actual, expected, false)).toBe(false);
  });

  it('still matches genuinely identical rows', () => {
    expect(
      resultsMatch(ok(['a', 'b'], [['ab', 'c']]), ok(['a', 'b'], [['ab', 'c']]), false),
    ).toBe(true);
  });

  it('distinguishes a null from an empty string', () => {
    // The distinction that actually occurs in fixture data: a LEFT JOIN with
    // no match yields NULL, and an empty text cell is a different fact.
    expect(resultsMatch(ok(['a'], [[null]]), ok(['a'], [['']]), false)).toBe(false);
  });
});

describe('resultsMatch — ordering and shape', () => {
  it('ignores row order unless the item requires it', () => {
    const a = ok(['id'], [[1], [2]]);
    const b = ok(['id'], [[2], [1]]);
    expect(resultsMatch(a, b, false)).toBe(true);
    expect(resultsMatch(a, b, true)).toBe(false);
  });

  it('rejects a different row count', () => {
    expect(resultsMatch(ok(['id'], [[1]]), ok(['id'], [[1], [2]]), false)).toBe(false);
  });

  it('rejects a different column count', () => {
    expect(resultsMatch(ok(['id'], [[1]]), ok(['id', 'x'], [[1, 2]]), false)).toBe(false);
  });

  it('treats a failed run as no match, in either position', () => {
    const failed: SqlRunResult = { ...ok(['id'], []), ok: false, errorCode: 'syntax' };
    expect(resultsMatch(failed, ok(['id'], []), false)).toBe(false);
    expect(resultsMatch(ok(['id'], []), failed, false)).toBe(false);
  });

  it('compares integers and their text form as equal, per normalisation', () => {
    // Deliberate: SQLite may return either, and the learner should not be
    // marked wrong for a driver detail they cannot see.
    expect(resultsMatch(ok(['n'], [[1]]), ok(['n'], [['1']]), false)).toBe(true);
  });
});

describe('safetyCheck', () => {
  it('accepts a plain SELECT and a CTE', () => {
    expect(safetyCheck('SELECT * FROM customers').safe).toBe(true);
    expect(safetyCheck('WITH x AS (SELECT 1) SELECT * FROM x').safe).toBe(true);
  });

  it('refuses anything that writes', () => {
    for (const sql of [
      'DELETE FROM customers',
      'UPDATE customers SET name = 1',
      'DROP TABLE customers',
      'INSERT INTO customers VALUES (1)',
    ]) {
      expect(safetyCheck(sql).safe, sql).toBe(false);
    }
  });

  it('refuses more than one statement', () => {
    expect(safetyCheck('SELECT 1; SELECT 2').safe).toBe(false);
  });
});
