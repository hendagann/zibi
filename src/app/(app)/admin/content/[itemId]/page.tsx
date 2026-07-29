import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ItemEditor } from '@/components/admin/ItemEditor';
import { readItemRaw } from '@/storage/contentWriter';
import { routes } from '@/lib/routes';
import { t } from '@/i18n';

export const dynamic = 'force-dynamic';

interface PageProps {
  readonly params: Promise<{ itemId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { itemId } = await params;
  return { title: `${t.adminEdit.editTitle} · ${itemId}` };
}

export default async function AdminItemEditPage({ params }: PageProps) {
  const { itemId } = await params;
  const raw = await readItemRaw(itemId);
  if (!raw) notFound();

  const parsed = JSON.parse(raw) as {
    review?: { status?: string };
    version?: number;
    title?: string;
  };
  const status = parsed.review?.status ?? 'draft';

  return (
    <Section
      title={`${t.adminEdit.editTitle}: ${parsed.title ?? itemId}`}
      aside={
        <>
          <Badge tone={status === 'approved' ? 'success' : 'warning'}>{status}</Badge>{' '}
          <Badge tone="neutral">
            {t.adminEdit.versionLabel} {parsed.version}
          </Badge>
        </>
      }
    >
      <Card>
        <ItemEditor itemId={itemId} rawJson={raw} status={status} />
      </Card>
      <p>
        <Link href={routes.adminContent}>{t.adminEdit.backToList}</Link>
      </p>
    </Section>
  );
}
