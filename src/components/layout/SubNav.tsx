'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SubNav.module.css';

interface SubNavItem {
  readonly href: string;
  readonly label: string;
}

interface SubNavProps {
  readonly items: readonly SubNavItem[];
  readonly label: string;
}

/**
 * Section-level navigation, used inside the admin area.
 *
 * Matching is exact rather than prefix-based: the admin overview lives at
 * `/admin`, which prefixes every other admin route, so a prefix match would
 * mark it active everywhere.
 */
export function SubNav({ items, label }: SubNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.subnav} aria-label={label}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={[styles.link, active ? styles.active : undefined]
              .filter(Boolean)
              .join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
