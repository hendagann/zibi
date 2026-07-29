#!/usr/bin/env node
/**
 * SQL execution child process.
 *
 * Reads {sql, schema, rows, maxRows} as JSON on stdin, builds a FRESH
 * in-memory SQLite database (sql.js/WASM), runs the query, and writes the
 * result as JSON on stdout.
 *
 * Isolation is layered, deliberately:
 *  - separate process — the parent kills it on timeout (real enforcement,
 *    not cooperative);
 *  - fresh database per run — even a mutation that slipped every guard
 *    would change a throwaway copy;
 *  - WASM memory — no filesystem or network reachable from SQL.
 *
 * The parent also pre-checks safety; the check here is defence in depth.
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function fail(code, message) {
  process.stdout.write(JSON.stringify({ ok: false, code, error: message }));
  process.exit(0);
}

const input = JSON.parse(await readStdin());
const { sql, schema, rows, maxRows = 200 } = input;

/* ---- safety: single read-only statement (defence in depth) ---- */
const stripped = sql
  .replace(/'(?:[^']|'')*'/g, "''")
  .replace(/"(?:[^"]|"")*"/g, '""')
  .replace(/--[^\n]*/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ');
const statements = stripped.split(';').map((s) => s.trim()).filter(Boolean);
if (statements.length > 1) fail('multi_statement', 'מותרת שאילתה אחת בלבד');
const BANNED = /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|ATTACH|DETACH|PRAGMA|REPLACE|TRUNCATE|VACUUM|REINDEX|GRANT)\b/i;
if (BANNED.test(stripped)) fail('unsafe', 'מותרות שאילתות קריאה בלבד');
if (!/^\s*(SELECT|WITH)\b/i.test(stripped)) fail('not_select', 'השאילתה חייבת להתחיל ב-SELECT');

/* ---- build the throwaway database ---- */
const initSqlJs = require('sql.js');
const sqlJsDir = dirname(require.resolve('sql.js'));
const SQL = await initSqlJs({
  locateFile: (file) => join(sqlJsDir, file),
});
const db = new SQL.Database();

for (const table of schema.tables) {
  const cols = table.columns.map((c) => `"${c.name}" ${c.type}`).join(', ');
  db.run(`CREATE TABLE "${table.name}" (${cols});`);
  const tableRows = rows[table.name] ?? [];
  if (tableRows.length) {
    const names = table.columns.map((c) => c.name);
    const placeholders = names.map(() => '?').join(', ');
    const stmt = db.prepare(
      `INSERT INTO "${table.name}" (${names.map((n) => `"${n}"`).join(', ')}) VALUES (${placeholders})`,
    );
    for (const row of tableRows) {
      stmt.run(names.map((n) => (row[n] === undefined ? null : row[n])));
    }
    stmt.free();
  }
}

/* ---- execute ---- */
try {
  const results = db.exec(sql);
  if (results.length === 0) {
    process.stdout.write(JSON.stringify({ ok: true, columns: [], rows: [], truncated: false }));
    process.exit(0);
  }
  const { columns, values } = results[0];
  const truncated = values.length > maxRows;
  process.stdout.write(
    JSON.stringify({
      ok: true,
      columns,
      rows: values.slice(0, maxRows),
      truncated,
      totalRows: values.length,
    }),
  );
} catch (error) {
  const message = String(error?.message ?? error);
  let code = 'sql_error';
  if (/syntax error/i.test(message)) code = 'syntax';
  else if (/no such table/i.test(message)) code = 'no_table';
  else if (/no such column/i.test(message)) code = 'no_column';
  else if (/ambiguous/i.test(message)) code = 'ambiguous';
  fail(code, message);
}
