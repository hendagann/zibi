#!/usr/bin/env node
/**
 * Enforces the content/UI boundary from docs/05-content-model.md §2.
 *
 * CM-20 — no learning content in `src/**`. Hebrew prose is the detectable
 *         proxy: UI chrome lives in `src/i18n`, so Hebrew appearing anywhere
 *         else in the source tree is either content that belongs in
 *         `content/` or a string that belongs in the dictionary.
 *
 * CM-21 — no content-specific identifier in a conditional. A component that
 *         branches on a topic, skill or item ID has behaviour that belongs on
 *         the content record instead.
 *
 * Comments are stripped before scanning: a Hebrew example inside an
 * explanatory comment is documentation, not shipped text.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_ROOTS = ['src'];
const ALLOWED_PREFIXES = ['src/i18n/'];
/** CM-20 scans data and style files too: Hebrew in a JSON or a CSS
 *  `content:` value is shipped text just as much as a JSX string. */
const TEXT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.css'];
/** CM-21 only applies where there is control flow. */
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

const HEBREW = /[\u0590-\u05FF]/;

/**
 * A content identifier: a 2\u20134 letter uppercase prefix, a separator, then the
 * rest. Covers all three shapes in use \u2014 `TD/black-box` (topic, docs/03 \u00A73),
 * `TD.BVA` (skill), `TD-black-box.EX.001` (content item, docs/05 \u00A74).
 */
const CONTENT_ID = `['"\`](?:[A-Z]{2,4}[./-][a-zA-Z0-9._-]+)['"\`]`;

/**
 * Keyed on the comparison itself rather than on the enclosing construct.
 * An earlier version looked for `if (`, `?`, `&&` or `||` *before* the
 * literal, which meant a ternary \u2014 where `?` comes after the condition \u2014
 * slipped through entirely. Matching the operator catches `if`, ternary,
 * `&&`, `||`, `switch` and membership tests with one pattern.
 */
const CONTENT_ID_IN_CONDITIONAL = new RegExp(
  [
    `[=!]==?\\s*${CONTENT_ID}`,
    `${CONTENT_ID}\\s*[=!]==?`,
    `\\bcase\\s+${CONTENT_ID}`,
    `\\.(?:includes|startsWith|endsWith)\\(\\s*${CONTENT_ID}`,
  ].join('|'),
);

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      yield* walk(full);
    } else if (TEXT_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      yield full;
    }
  }
}

/**
 * Remove block and line comments so documentation is not scanned.
 *
 * A character-level scanner, not a regex: a naive `\/\*[\s\S]*?\*\//` eats
 * from a `/*` that appears *inside a string literal* to the next `*​/`
 * anywhere in the file, deleting real code — including any Hebrew in it —
 * from the scan. A checker with a blind spot like that reads as a control
 * while enforcing nothing, so comments are recognised only outside strings.
 * Stripped spans are replaced with spaces to keep line numbers stable.
 */
function stripComments(source) {
  let out = '';
  let i = 0;
  let mode = 'code'; // code | line | block | single | double | template
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (mode === 'code') {
      if (ch === '/' && next === '/') {
        mode = 'line';
        out += '  ';
        i += 2;
      } else if (ch === '/' && next === '*') {
        mode = 'block';
        out += '  ';
        i += 2;
      } else {
        if (ch === "'") mode = 'single';
        else if (ch === '"') mode = 'double';
        else if (ch === '`') mode = 'template';
        out += ch;
        i += 1;
      }
    } else if (mode === 'line') {
      if (ch === '\n') {
        mode = 'code';
        out += ch;
      } else {
        out += ' ';
      }
      i += 1;
    } else if (mode === 'block') {
      if (ch === '*' && next === '/') {
        mode = 'code';
        out += '  ';
        i += 2;
      } else {
        out += ch === '\n' ? '\n' : ' ';
        i += 1;
      }
    } else {
      // Inside a string: comment markers are data. A backslash escapes the
      // next character, including the closing quote.
      if (ch === '\\') {
        out += ch + (next ?? '');
        i += 2;
        continue;
      }
      if (
        (mode === 'single' && (ch === "'" || ch === '\n')) ||
        (mode === 'double' && (ch === '"' || ch === '\n')) ||
        (mode === 'template' && ch === '`')
      ) {
        mode = 'code';
      }
      out += ch;
      i += 1;
    }
  }
  return out;
}

function isAllowed(relPath) {
  return ALLOWED_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

const violations = [];

for (const scanRoot of SCAN_ROOTS) {
  for await (const file of walk(join(ROOT, scanRoot))) {
    const relPath = relative(ROOT, file).split('\\').join('/');
    if (isAllowed(relPath)) continue;

    const isCode = CODE_EXTENSIONS.some((ext) => relPath.endsWith(ext));
    const raw = await readFile(file, 'utf8');
    const code = isCode ? stripComments(raw) : raw;
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      if (HEBREW.test(line)) {
        violations.push({
          rule: 'CM-20',
          file: relPath,
          line: index + 1,
          text: line.trim().slice(0, 100),
          message:
            'Hebrew text outside src/i18n. UI strings belong in the dictionary; learning content belongs in content/.',
        });
      }
      if (isCode && CONTENT_ID_IN_CONDITIONAL.test(line)) {
        violations.push({
          rule: 'CM-21',
          file: relPath,
          line: index + 1,
          text: line.trim().slice(0, 100),
          message:
            'Conditional on a content identifier. Put the behaviour on the content record instead.',
        });
      }
    });
  }
}

if (violations.length > 0) {
  console.error(
    `\nContent boundary violations (${violations.length}) — docs/05 §2:\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.rule}  ${v.file}:${v.line}`);
    console.error(`        ${v.text}`);
    console.error(`        ${v.message}\n`);
  }
  process.exit(1);
}

console.log('Content boundary OK — no learning content in src/, no content-specific branching.');
