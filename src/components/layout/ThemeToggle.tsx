'use client';

import { useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from '@/lib/constants';
import { t } from '@/i18n';
import styles from './AppShell.module.css';

type Theme = 'light' | 'dark';

/**
 * Light / dark switch.
 *
 * The attribute on <html> is the single source of truth, and it is already set
 * before this component mounts — the inline script in the layout does it, so
 * the page never paints in the wrong palette and then corrects itself. This
 * component therefore READS the attribute for its initial state rather than
 * deciding it, which is also what keeps server and client markup identical.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the theme still applies for this
      // session. Losing the preference is a smaller failure than crashing.
    }
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggle}
      // Until mounted the stored value is unknown to React, and announcing a
      // pressed state that may be wrong is worse than announcing none.
      aria-pressed={mounted ? isDark : undefined}
      aria-label={isDark ? t.theme.switchToLight : t.theme.switchToDark}
      title={isDark ? t.theme.switchToLight : t.theme.switchToDark}
    >
      <span className={styles.themeIcon} aria-hidden="true">
        {isDark ? <SunIcon /> : <MoonIcon />}
      </span>
      <span className={styles.themeLabel}>
        {isDark ? t.theme.light : t.theme.dark}
      </span>
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
