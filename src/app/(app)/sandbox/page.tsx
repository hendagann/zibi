import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { SqlSandbox } from '@/components/practice/SqlSandbox';
import { getDatasets } from '@/content/loader';
import { t } from '@/i18n';

// Datasets are content files; an added dataset must appear without a rebuild.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: t.sandbox.title };

export default async function SandboxPage() {
  const datasets = await getDatasets();

  return (
    <>
      <PageHeader title={t.sandbox.title} subtitle={t.sandbox.subtitle} />

      <Section title={t.sandbox.queryLabel} description={t.sandbox.warmupHint}>
        <Card>
          <SqlSandbox datasets={datasets} />
        </Card>
      </Section>
    </>
  );
}
