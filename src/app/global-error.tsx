'use client';

import { ErrorState } from '@/components/states/ErrorState';
import { t } from '@/i18n';
import './globals.css';

/**
 * The last-resort boundary. It replaces the root layout, so it has to render
 * its own `<html>` — including `dir` and `lang`, or the failure page would
 * come out left-to-right in a Hebrew product.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div style={{ padding: '2rem', maxInlineSize: '48rem', marginInline: 'auto' }}>
          <ErrorState
            title={t.states.error.title}
            body={t.states.error.body}
            onRetry={reset}
            {...(error.digest ? { details: error.digest } : {})}
          />
        </div>
      </body>
    </html>
  );
}
