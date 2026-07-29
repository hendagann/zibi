import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { SubNav } from '@/components/layout/SubNav';
import { adminNav } from '@/lib/navigation';
import { t } from '@/i18n';

/**
 * The admin area.
 *
 * There is no access control here. Authentication is out of scope for Phase 1,
 * and a check that always passes would be worse than none — it would read like
 * a control that exists. Gating this route is tracked as an open item.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <PageHeader
        title={t.admin.title}
        subtitle={t.admin.subtitle}
        badge={<Badge tone="warning">{t.phase.noticeTitle}</Badge>}
      />
      <SubNav items={adminNav} label={t.admin.sectionLabel} />
      {children}
    </>
  );
}
