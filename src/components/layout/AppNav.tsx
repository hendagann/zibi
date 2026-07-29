'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MOBILE_NAV_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';
import { primaryNav } from '@/lib/navigation';
import { isActiveRoute, routes } from '@/lib/routes';
import { t } from '@/i18n';
import { CloseIcon, MenuIcon, navIcons } from './NavIcons';
import styles from './AppShell.module.css';

/**
 * Primary navigation.
 *
 * One `<nav>` serves both breakpoints. On wide screens it is a persistent
 * sidebar; below 64rem the same element becomes an off-canvas drawer. The list
 * is not duplicated, so assistive technology sees a single navigation landmark
 * rather than two competing ones.
 *
 * Dialog semantics — `aria-modal`, focus movement, Escape to close — are
 * applied only while the drawer is actually a drawer. Announcing a permanently
 * visible sidebar as a modal would be wrong on a desktop screen.
 */
export function AppNav() {
  const pathname = usePathname();
  const isMobile = useMediaQuery(MOBILE_NAV_QUERY);
  const [isOpen, setIsOpen] = useState(false);

  const navId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  // A route change closes the drawer. Without this, tapping a link on a phone
  // navigates behind an open overlay.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Leaving the mobile breakpoint with the drawer open would otherwise leave
  // the body scroll-locked against a sidebar that is no longer a drawer.
  useEffect(() => {
    if (!isMobile) setIsOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isOpen || !isMobile) return;

    // Captured now, not read in cleanup: focus must return to the control that
    // opened the drawer, which is the same node for the drawer's whole life.
    const toggle = toggleRef.current;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      toggle?.focus();
    };
  }, [isOpen, isMobile, close]);

  const drawerProps = isMobile
    ? {
        role: 'dialog' as const,
        'aria-modal': true,
        // Closed drawer is taken out of the tab order. CSS `visibility` does
        // the same thing before hydration, so a keyboard user on a phone can
        // never tab into an off-canvas panel either way.
        ...(isOpen ? {} : { inert: true }),
      }
    : {};

  return (
    <>
      <header className={styles.topbar}>
        <button
          ref={toggleRef}
          type="button"
          className={styles.menuButton}
          aria-expanded={isOpen}
          aria-controls={navId}
          // A stable name. The drawer also contains a close button, and giving
          // the toggle the same name when open would put two controls with an
          // identical accessible name in one view. `aria-expanded` already
          // carries the state.
          aria-label={t.nav.menu}
          onClick={() => setIsOpen((open) => !open)}
        >
          <MenuIcon />
        </button>
        <span className={styles.topbarBrand}>{t.app.name}</span>
      </header>

      {isOpen && isMobile ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label={t.common.close}
          onClick={close}
        />
      ) : null}

      <nav
        id={navId}
        aria-label={t.nav.primaryLabel}
        className={[styles.sidebar, isOpen ? styles.sidebarOpen : undefined]
          .filter(Boolean)
          .join(' ')}
        {...drawerProps}
      >
        <div className={styles.brand}>
          <Link href={routes.dashboard} className={styles.brandName}>
            {t.app.name}
          </Link>
          <button
            ref={closeRef}
            type="button"
            className={styles.closeButton}
            aria-label={t.nav.closeMenu}
            onClick={close}
          >
            <CloseIcon />
          </button>
        </div>

        <ul className={styles.navList}>
          {primaryNav.map((item) => {
            const Icon = navIcons[item.icon];
            const active = isActiveRoute(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    styles.navLink,
                    active ? styles.navLinkActive : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Icon className={styles.navIcon} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={styles.sidebarFooter}>
          <span>{t.account.label}</span>
          <span>{t.account.signedOut}</span>
        </div>
      </nav>
    </>
  );
}
