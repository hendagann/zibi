import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SqlDataset } from '@/sql/executor';
import { executeSql, safetyCheck } from '@/sql/executor';
import { evaluateSql, redistributeWeights, type SqlEvaluateInput } from './sqlEngine';
import type { RubricDoc } from './types';

/**
 * SQL evaluation tests run against the REAL rubric, REAL dataset and REAL
 * exercises — and every query actually executes in the sandboxed child
 * process. Nothing here inspects SQL text to decide correctness.
 */

const CONTENT = join(process.cwd(), 'content');

async function loadJson<T>(...segments: string[]): Promise<T> {
  return JSON.parse(await readFile(join(CONTENT, ...segments), 'utf8'));
}

async function loadSqlExercises() {
  const files = (await readdir(join(CONTENT, 'exercises'))).filter((f) => f.endsWith('.json'));
  const items = await Promise.all(
    files.map((f) => loadJson<Record<string, unknown>>('exercises', f)),
  );
  return items.filter((i) => i.questionType === 'sql_query') as {
    id: string;
    version: number;
    sqlSpec: SqlEvaluateInput['spec'];
    modelAnswer: { sql: string };
  }[];
}

/**
 * Resolve a dataset by the `id` field inside it, exactly as `getDataset` does
 * — not by filename. An earlier version of this file loaded `shop.json` for
 * every exercise, which silently scored items against the wrong database the
 * moment a second dataset existed.
 */
async function loadDatasetById(datasetId: string): Promise<SqlDataset> {
  const files = (await readdir(join(CONTENT, 'datasets'))).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const parsed = await loadJson<SqlDataset & { id: string }>('datasets', file);
    if (parsed.id === datasetId) return parsed;
  }
  throw new Error(`dataset not found: ${datasetId}`);
}

async function evalSql(sql: string, exercise: Awaited<ReturnType<typeof loadSqlExercises>>[number]) {
  const rubric = await loadJson<RubricDoc>('rubrics', 'RUB.SQL.json');
  const dataset = await loadDatasetById(exercise.sqlSpec.datasetRef);
  return evaluateSql({
    sql,
    spec: exercise.sqlSpec,
    rubric,
    dataset,
    questionId: exercise.id,
    itemVersion: exercise.version,
    attemptId: 'sql-test',
    attemptNumber: 1,
    userId: 'test',
    submittedAt: '2026-07-29T10:00:00.000Z',
  });
}

describe('golden: every SQL model answer scores 100 (QM-09)', () => {
  // Discovered, not counted: pinning an exact number turns every new exercise
  // into a failing test for the wrong reason, and tempts whoever sees it to
  // bump the number instead of checking the item.
  it('holds for every SQL exercise in the library, hidden fixtures included', async () => {
    const exercises = await loadSqlExercises();
    expect(exercises.length).toBeGreaterThanOrEqual(50);
    for (const exercise of exercises) {
      const result = await evalSql(exercise.modelAnswer.sql, exercise);
      expect(result.final_score, exercise.id).toBe(100);
      expect(result.unevaluable).toBe(false);
    }
  }, 120000);
});

describe('multiple valid query forms', () => {
  it('accepts a differently-written correct query at full marks', async () => {
    const exercises = await loadSqlExercises();
    const ex1 = exercises.find((e) => e.id === 'TECH-data.EX.001')!;
    // Different casing, table alias, explicit ASC omitted differently,
    // redundant-but-harmless parentheses — same result set.
    const variant =
      'select p.name, p.price from products p where (p.price < 200.0) order by p.price';
    const result = await evalSql(variant, ex1);
    expect(result.final_score).toBe(100);
  }, 60000);

  it('accepts JOIN written in the opposite direction', async () => {
    const exercises = await loadSqlExercises();
    const ex3 = exercises.find((e) => e.id === 'TECH-data.EX.003')!;
    const variant =
      "SELECT c.name, o.order_date FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'completed'";
    const result = await evalSql(variant, ex3);
    expect(result.final_score).toBe(100);
  }, 60000);
});

describe('partially correct queries', () => {
  it('correct on visible data but wrong on a hidden boundary case is capped (§9.3)', async () => {
    const exercises = await loadSqlExercises();
    const ex1 = exercises.find((e) => e.id === 'TECH-data.EX.001')!;
    // <= 200 matches the visible dataset exactly (no product costs 200),
    // but the hidden fixture adds one priced 200.00 — the boundary trap.
    const boundary =
      'SELECT name, price FROM products WHERE price <= 200 ORDER BY price ASC';
    const result = await evalSql(boundary, ex1);
    expect(result.final_score).toBeLessThan(100);
    expect(result.final_score).toBeGreaterThan(0);
    const c5 = result.criterion_results.find((c) => c.criterion_id === 'c5');
    const c6 = result.criterion_results.find((c) => c.criterion_id === 'c6');
    expect(c5?.performance_level).toBeLessThanOrEqual(2);
    expect(c6?.performance_level).toBeLessThanOrEqual(1);
  }, 60000);

  it('COUNT(*) after LEFT JOIN is caught by the orderless-customer fixture', async () => {
    const exercises = await loadSqlExercises();
    const ex4 = exercises.find((e) => e.id === 'TECH-data.EX.004')!;
    const countStar =
      'SELECT customers.name, COUNT(*) AS order_count FROM customers LEFT JOIN orders ON orders.customer_id = customers.id GROUP BY customers.id, customers.name';
    const result = await evalSql(countStar, ex4);
    // Visible data already contains orderless customers, so this fails there
    // too. Per docs/07 §9.3 a wrong result zeroes c5 while structure criteria
    // stand — the arithmetic lands on 65, and correctness earns nothing.
    const c5 = result.criterion_results.find((c) => c.criterion_id === 'c5');
    const c6 = result.criterion_results.find((c) => c.criterion_id === 'c6');
    expect(c5?.performance_level).toBe(0);
    expect(c6?.performance_level).toBe(0);
    expect(result.final_score).toBe(65);
  }, 60000);

  it('a wrong result on visible data zeroes correctness but keeps structure points', async () => {
    const exercises = await loadSqlExercises();
    const ex3 = exercises.find((e) => e.id === 'TECH-data.EX.003')!;
    const wrongFilter =
      "SELECT customers.name, orders.order_date FROM orders JOIN customers ON customers.id = orders.customer_id WHERE orders.status = 'pending'";
    const result = await evalSql(wrongFilter, ex3);
    const c5 = result.criterion_results.find((c) => c.criterion_id === 'c5');
    expect(c5?.performance_level).toBe(0);
    expect(result.final_score).toBeGreaterThan(0);
    expect(result.final_score).toBeLessThan(60);
  }, 60000);
});

describe('empty and unsafe queries', () => {
  it('an empty answer gates to 0', async () => {
    const exercises = await loadSqlExercises();
    const result = await evalSql('   ', exercises[0]!);
    expect(result.final_score).toBe(0);
    expect(result.cap_source).toBe('E-GEN-001');
  });

  it('a data-modifying statement is blocked, never executed, and scores 0', async () => {
    const exercises = await loadSqlExercises();
    const result = await evalSql('DROP TABLE customers', exercises[0]!);
    expect(result.final_score).toBe(0);
    expect(result.cap_source).toBe('E-SQL-002');
    expect(result.confidence_reasons.join(' ')).toContain('לא הורצה');
  });

  it('a second statement smuggled after a semicolon is blocked', async () => {
    const exercises = await loadSqlExercises();
    const result = await evalSql(
      'SELECT name FROM products; DELETE FROM products',
      exercises[0]!,
    );
    expect(result.final_score).toBe(0);
    expect(result.cap_source).toBe('E-SQL-002');
  });

  it('banned keywords inside string literals do not trigger the guard', () => {
    expect(safetyCheck("SELECT 'DROP TABLE x' AS label FROM products").safe).toBe(true);
    expect(safetyCheck('SELECT name FROM products -- DELETE nothing').safe).toBe(true);
  });

  it('a syntactically broken query caps the score at 40', async () => {
    const exercises = await loadSqlExercises();
    const result = await evalSql('SELECT name FROMM products', exercises[0]!);
    expect(result.score_cap).toBe(40);
    expect(result.final_score).toBeLessThanOrEqual(40);
  }, 60000);
});

describe('execution limits', () => {
  it('row output is truncated at the limit', async () => {
    const dataset = await loadJson<SqlDataset>('datasets', 'shop.json');
    // A cartesian product of four tables — far beyond 200 rows.
    const result = await executeSql(
      'SELECT customers.id FROM customers, orders, products, order_items',
      dataset,
    );
    expect(result.ok).toBe(true);
    expect(result.rows.length).toBeLessThanOrEqual(200);
    expect(result.truncated).toBe(true);
  }, 60000);

  it('Hebrew error explanation for a missing table', async () => {
    const dataset = await loadJson<SqlDataset>('datasets', 'shop.json');
    const result = await executeSql('SELECT * FROM invoices', dataset);
    expect(result.ok).toBe(false);
    expect(result.errorHe).toContain('אינה קיימת');
  }, 60000);
});

describe('criterion applicability (§9.2)', () => {
  it('redistributed weights total exactly 100 without the join criterion', async () => {
    const rubric = await loadJson<RubricDoc>('rubrics', 'RUB.SQL.json');
    const weights = redistributeWeights(rubric, ['c3']);
    const total = [...weights.values()].reduce((s, w) => s + w, 0);
    expect(Math.round(total * 100) / 100).toBe(100);
    expect(weights.has('c3')).toBe(false);
  });

  it('single-table exercises omit the join criterion from results', async () => {
    const exercises = await loadSqlExercises();
    const ex1 = exercises.find((e) => e.id === 'TECH-data.EX.001')!;
    const result = await evalSql(ex1.modelAnswer.sql, ex1);
    expect(result.criterion_results.map((c) => c.criterion_id)).not.toContain('c3');
    const totalMax = result.criterion_results.reduce((s, c) => s + c.max_points, 0);
    expect(Math.round(totalMax * 100) / 100).toBe(100);
  }, 60000);
});
