import type { NavIconName } from '@/components/layout/NavIcons';
import { t } from '@/i18n';
import { routes } from './routes';

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: NavIconName;
}

/** Primary navigation, in display order. */
export const primaryNav: readonly NavItem[] = [
  { href: routes.dashboard, label: t.nav.dashboard, icon: 'dashboard' },
  { href: routes.topics, label: t.nav.topics, icon: 'topics' },
  { href: routes.practice, label: t.nav.practice, icon: 'practice' },
  { href: routes.exam, label: t.nav.exam, icon: 'exam' },
  { href: routes.progress, label: t.nav.progress, icon: 'progress' },
  { href: routes.admin, label: t.nav.admin, icon: 'admin' },
];

/** Sub-navigation inside the admin area. */
export const adminNav: readonly Omit<NavItem, 'icon'>[] = [
  { href: routes.admin, label: t.admin.overview },
  { href: routes.adminContent, label: t.admin.content },
  { href: routes.adminRubrics, label: t.admin.rubrics },
  { href: routes.adminReview, label: t.admin.reviewQueue },
];
