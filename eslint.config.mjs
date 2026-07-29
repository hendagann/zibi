import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // The content/UI boundary (CM-20, CM-21) is enforced by
      // `scripts/check-content-boundary.mjs`, not here. An earlier attempt to
      // express CM-21 as an esquery selector silently matched nothing — topic
      // identifiers are slash-separated (`TD/black-box`) and the selector
      // required a dot or hyphen — so it read like a control while enforcing
      // nothing. One enforcement point, with its own tests, is safer than two
      // where one is dead.
    },
  },
];

export default config;
