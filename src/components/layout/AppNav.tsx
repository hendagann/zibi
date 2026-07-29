'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MOBILE_NAV_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';
import { MAIN_CONTENT_ID } from '@/lib/constants';
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

    // `aria-modal` hides the page from a screen reader but does nothing to the
    // tab order, which is DOM order. Without this, Tab walks straight out of
    // the drawer and into the page behind it. Marking the main landmark inert
    // is the whole focus trap — no key interception, and it also stops mouse
    // and pointer interaction with content the overlay is covering.
    const main = document.getElementById(MAIN_CONTENT_ID);
    main?.setAttribute('inert', '');

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
      // Inert must come off before focus moves back, or the focus call is
      // silently dropped.
      main?.removeAttribute('inert');
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
        // Not a button. A focusable full-screen element sitting outside the
        // dialog is an extra tab stop that leads nowhere useful, and it was
        // the seam through which Tab escaped the drawer. Pointer users click
        // it; keyboard users press Escape, which is the documented way to
        // dismiss a dialog anyway.
        <div
          className={styles.backdrop}
          onClick={close}
          aria-hidden="true"
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
            // `page` only on an exact match. On /admin/content both the
            // sidebar's /admin and the sub-nav's /admin/content are "active",
            // but two links cannot both be the current page — the ancestor
            // gets `true` (current section), the exact match gets `page`.
            const current = active
              ? pathname === item.href
                ? ('page' as const)
                : ('true' as const)
              : undefined;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current}
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
