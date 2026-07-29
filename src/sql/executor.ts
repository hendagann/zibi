import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { t } from '@/i18n';

/**
 * SQL execution — parent side.
 *
 * Every query runs in a child process against a fresh in-memory database
 * built from the exercise's dataset. The timeout is enforced by killing the
 * child, not by asking the query nicely; the row limit is enforced inside.
 * Safety is checked here BEFORE spawning and again inside the child.
 */

export interface SqlDataset {
  readonly schema: {
    readonly tables: readonly {
      readonly name: string;
      readonly columns: readonly { readonly name: string; readonly type: string; readonly he: string }[];
    }[];
  };
  readonly rows: Readonly<Record<string, readonly Record<string, unknown>[]>>;
}

export interface SqlRunResult {
  readonly ok: boolean;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly unknown[])[];
  readonly truncated: boolean;
  readonly errorCode: string | null;
  /** Learner-facing Hebrew explanation of what went wrong. */
  readonly errorHe: string | null;
  readonly timedOut: boolean;
  readonly unsafe: boolean;
}

const TIMEOUT_MS = Number(process.env.ZIBI_SQL_TIMEOUT_MS ?? 3000);
const MAX_ROWS = 200;

const BANNED =
  /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|ATTACH|DETACH|PRAGMA|REPLACE|TRUNCATE|VACUUM|REINDEX|GRANT)\b/i;

/** Strip string literals and comments so keywords inside them do not trigger. */
function strippedSql(sql: string): string {
  return sql
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""')
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

export function safetyCheck(sql: string): { safe: boolean; reasonHe?: string } {
  const stripped = strippedSql(sql);
  const statements = stripped.split(';').map((s) => s.trim()).filter(Boolean);
  if (statements.length === 0) return { safe: false, reasonHe: t.sqlErrors.empty };
  if (statements.length > 1)
    return { safe: false, reasonHe: t.sqlErrors.multiStatementLong };
  if (BANNED.test(stripped))
    return { safe: false, reasonHe: t.sqlErrors.readOnlyLong };
  if (!/^\s*(SELECT|WITH)\b/i.test(stripped))
    return { safe: false, reasonHe: t.sqlErrors.mustStartSelect };
  return { safe: true };
}

const ERROR_HE: Record<string, (message: string) => string> = {
  syntax: () => t.sqlErrors.syntax,
  no_table: (m) => {
    const table = /no such table:\s*(\S+)/i.exec(m)?.[1];
    return t.sqlErrors.noTable(table ?? t.sqlErrors.unnamed);
  },
  no_column: (m) => {
    const column = /no such column:\s*(\S+)/i.exec(m)?.[1];
    return t.sqlErrors.noColumn(column ?? t.sqlErrors.unnamed);
  },
  ambiguous: () => t.sqlErrors.ambiguous,
  multi_statement: () => t.sqlErrors.multiStatement,
  unsafe: () => t.sqlErrors.readOnly,
  not_select: () => t.sqlErrors.mustStartSelect,
  sql_error: (m) => t.sqlErrors.failed(m),
};

export async function executeSql(
  sql: string,
  dataset: SqlDataset,
  extraRows?: Readonly<Record<string, readonly Record<string, unknown>[]>>,
): Promise<SqlRunResult> {
  const safety = safetyCheck(sql);
  if (!safety.safe) {
    return {
      ok: false, columns: [], rows: [], truncated: false,
      errorCode: 'unsafe', errorHe: safety.reasonHe ?? null,
      timedOut: false, unsafe: true,
    };
  }

  const rows: Record<string, readonly Record<string, unknown>[]> = { ...dataset.rows };
  if (extraRows) {
    for (const [table, extra] of Object.entries(extraRows)) {
      rows[table] = [...(rows[table] ?? []), ...extra];
    }
  }

  const payload = JSON.stringify({ sql, schema: dataset.schema, rows, maxRows: MAX_ROWS });
  const child = await runChild(payload);

  if (child.timedOut) {
    return {
      ok: false, columns: [], rows: [], truncated: false,
      errorCode: 'timeout',
      errorHe: t.sqlErrors.timeout(TIMEOUT_MS / 1000),
      timedOut: true, unsafe: false,
    };
  }
  if (child.failed) {
    return {
      ok: false, columns: [], rows: [], truncated: false,
      errorCode: 'executor_error', errorHe: t.sqlErrors.executorFailed,
      timedOut: false, unsafe: false,
    };
  }

  let result: {
    ok: boolean; code?: string; error?: string;
    columns?: string[]; rows?: unknown[][]; truncated?: boolean;
  };
  try {
    result = JSON.parse(child.stdout);
  } catch {
    return {
      ok: false, columns: [], rows: [], truncated: false,
      errorCode: 'executor_error', errorHe: t.sqlErrors.executorFailed,
      timedOut: false, unsafe: false,
    };
  }

  if (!result.ok) {
    const code = result.code ?? 'sql_error';
    return {
      ok: false, columns: [], rows: [], truncated: false,
      errorCode: code,
      errorHe: (ERROR_HE[code] ?? ERROR_HE.sql_error!)(result.error ?? ''),
      timedOut: false,
      unsafe: code === 'unsafe' || code === 'multi_statement' || code === 'not_select',
    };
  }
  return {
    ok: true,
    columns: result.columns ?? [],
    rows: result.rows ?? [],
    truncated: result.truncated ?? false,
    errorCode: null, errorHe: null, timedOut: false, unsafe: false,
  };
}

/**
 * Spawns the child, pipes the payload over stdin, and kills it with SIGKILL
 * when the timeout expires — the query cannot opt out of being stopped.
 */
function runChild(
  payload: string,
): Promise<{ stdout: string; timedOut: boolean; failed: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [join(process.cwd(), 'scripts', 'run-sql.mjs')],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      resolve({ stdout: '', timedOut: true, failed: false });
    }, TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.on('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout: '', timedOut: false, failed: true });
    });
    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (signal === 'SIGKILL') resolve({ stdout: '', timedOut: true, failed: false });
      else if (code !== 0) resolve({ stdout: '', timedOut: false, failed: true });
      else resolve({ stdout, timedOut: false, failed: false });
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
}

/* ---- result comparison (docs/07 §9.1) ---- */

function normaliseCell(value: unknown): string {
  if (value === null || value === undefined) return '␀';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(6);
  return String(value);
}

function normaliseRow(row: readonly unknown[]): string {
  return row.map(normaliseCell).join('');
}

/**
 * Result-set comparison: order-insensitive multiset equality unless the
 * exercise requires ordering. Never compares SQL text — many correct queries
 * exist for one task (docs/07 §9.1).
 */
export function resultsMatch(
  actual: SqlRunResult,
  expected: SqlRunResult,
  orderMatters: boolean,
): boolean {
  if (!actual.ok || !expected.ok) return false;
  if (actual.columns.length !== expected.columns.length) return false;
  if (actual.rows.length !== expected.rows.length) return false;
  const a = actual.rows.map(normaliseRow);
  const b = expected.rows.map(normaliseRow);
  if (orderMatters) return a.every((row, i) => row === b[i]);
  return [...a].sort().join('\n') === [...b].sort().join('\n');
}
