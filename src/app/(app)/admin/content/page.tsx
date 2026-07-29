import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/states/EmptyState';
import { getAllItemsForAdmin } from '@/content/loader';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';
import styles from './admin-content.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: t.admin.content };

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
  approved: 'success',
  needs_update: 'warning',
  in_review: 'warning',
  draft: 'neutral',
  retired: 'danger',
};

/**
 * The authoring list — the one surface that shows unapproved items, through
 * the admin-only loader accessor. Learner surfaces never render from here.
 */
export default async function AdminContentPage() {
  const items = await getAllItemsForAdmin();
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <Section title={t.admin.content} aside={`${t.common.count}: ${items.length}`}>
      {sorted.length ? (
        <Card variant="flush">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">{t.adminEdit.statusLabel}</th>
                <th scope="col">{t.adminEdit.versionLabel}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.itemTitle}>{item.title}</div>
                    <code className={styles.itemId}>{item.id}</code>
                  </td>
                  <td>
                    <Badge tone={STATUS_TONE[item.review?.status ?? 'draft'] ?? 'neutral'}>
                      {item.review?.status}
                    </Badge>
                  </td>
                  <td>{item.version}</td>
                  <td>
                    <Link href={`${routes.adminContent}/${item.id}`}>
                      {t.adminEdit.openItem}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState body={t.admin.contentEmpty} />
      )}
    </Section>
  );
}
