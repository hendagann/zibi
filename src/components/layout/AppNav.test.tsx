import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { primaryNav } from '@/lib/navigation';
import { t } from '@/i18n';
import { AppNav } from './AppNav';

/**
 * Forces `useMediaQuery` to report the mobile breakpoint, so the drawer
 * behaviour can be exercised. The default stub in vitest.setup.ts reports
 * desktop.
 */
function useMobileViewport() {
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const desktopMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = desktopMatchMedia;
});

// `usePathname` is stubbed to '/dashboard' in vitest.setup.ts.
describe('AppNav', () => {
  it('renders every primary destination exactly once', () => {
    render(<AppNav />);
    for (const item of primaryNav) {
      const link = screen.getByRole('link', { name: item.label });
      expect(link).toHaveAttribute('href', item.href);
    }
  });

  it('exposes a single navigation landmark, not one per breakpoint', () => {
    render(<AppNav />);
    expect(
      screen.getAllByRole('navigation', { name: t.nav.primaryLabel }),
    ).toHaveLength(1);
  });

  it('marks the current route with aria-current', () => {
    render(<AppNav />);
    const active = screen.getByRole('link', { name: t.nav.dashboard });
    expect(active).toHaveAttribute('aria-current', 'page');

    const inactive = screen.getByRole('link', { name: t.nav.practice });
    expect(inactive).not.toHaveAttribute('aria-current');
  });

  it('starts with the mobile drawer closed', () => {
    render(<AppNav />);
    const toggle = screen.getByRole('button', { name: t.nav.menu });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('gives the menu toggle and the drawer close button distinct names', () => {
    render(<AppNav />);
    // Two controls with the same accessible name in one view is ambiguous for
    // a screen reader user, so the toggle keeps a stable label.
    expect(t.nav.menu).not.toBe(t.nav.closeMenu);
    expect(
      screen.getAllByRole('button', { name: t.nav.menu }),
    ).toHaveLength(1);
  });

  it('points the toggle at the navigation it controls', () => {
    render(<AppNav />);
    const toggle = screen.getByRole('button', { name: t.nav.menu });
    const controls = toggle.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls as string)).not.toBeNull();
  });

  it('does not apply dialog semantics on a wide screen', () => {
    const { container } = render(<AppNav />);
    const nav = container.querySelector('nav');
    expect(nav).not.toHaveAttribute('role', 'dialog');
    expect(nav).not.toHaveAttribute('inert');
  });
});

describe('AppNav on a narrow screen', () => {
  it('treats the closed drawer as inert so it cannot be tabbed into', async () => {
    useMobileViewport();
    const { container } = render(<AppNav />);
    await waitFor(() => {
      expect(container.querySelector('nav')).toHaveAttribute('inert');
    });
  });

  it('becomes a dialog and drops inert once opened', async () => {
    useMobileViewport();
    const { container } = render(<AppNav />);

    await userEvent.click(
      screen.getByRole('button', { name: t.nav.menu }),
    );

    await waitFor(() => {
      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('role', 'dialog');
      expect(nav).toHaveAttribute('aria-modal', 'true');
      expect(nav).not.toHaveAttribute('inert');
    });
  });

  it('reflects the open state on the toggle', async () => {
    useMobileViewport();
    render(<AppNav />);

    const toggle = screen.getByRole('button', { name: t.nav.menu });
    await userEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
