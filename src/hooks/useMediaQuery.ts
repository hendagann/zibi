'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks a media query.
 *
 * Returns `false` on the server and on the first client render so that markup
 * matches during hydration; the real value arrives in the effect. Layout that
 * must be correct before hydration should use CSS, not this hook — this exists
 * for behaviour (focus trapping, dialog semantics), not for appearance.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Below this width the sidebar becomes an off-canvas drawer. */
export const MOBILE_NAV_QUERY = '(max-width: 63.99rem)';
