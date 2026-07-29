'use client';

import { useCallback, useRef } from 'react';

/**
 * Elapsed seconds since the component mounted.
 *
 * Deliberately not a state value: it is read once, at submission. Keeping it
 * in a ref means the timer never triggers a re-render while the learner types.
 * The server drops implausible durations (docs/09 §7), so an abandoned tab
 * cannot poison the speed dimension.
 */
export function useElapsedSeconds(): () => number {
  const startedAt = useRef<number>(Date.now());
  return useCallback(() => Math.round((Date.now() - startedAt.current) / 1000), []);
}
