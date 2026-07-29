'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/states/ErrorState';

/**
 * Shared error boundary for every route in the shell.
 *
 * The digest — not the message — is what is surfaced. In production Next
 * redacts server error messages anyway, and the digest is the value that lets
 * a report be matched to a server log entry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState onRetry={reset} {...(error.digest ? { details: error.digest } : {})} />
  );
}
