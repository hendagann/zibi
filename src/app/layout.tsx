import type { Metadata, Viewport } from 'next';
import { Heebo, Poppins } from 'next/font/google';
import { t } from '@/i18n';
import './globals.css';

/**
 * Two families, each doing the job it is good at (design-reference/Read me.txt
 * names Poppins; Hebrew needs a Hebrew face).
 *
 * Heebo carries Hebrew body text and is listed first in `--font-sans`, so
 * ordinary prose renders in it. Poppins carries Latin, numerals and display
 * headings — it has no Hebrew coverage, which is exactly why it must not lead
 * the stack: a browser would fall back per-glyph and Hebrew would render in a
 * system face with a different vertical rhythm. Both are self-hosted by
 * next/font, so no external request is made at runtime.
 */
const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heebo',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: t.app.name,
    template: `%s · ${t.app.name}`,
  },
  description: t.app.description,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // One colour: the product is dark by design, not by preference.
  themeColor: '#0a0b0c',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
