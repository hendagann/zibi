import type { Metadata, Viewport } from 'next';
import { Heebo, Poppins } from 'next/font/google';
import { THEME_STORAGE_KEY } from '@/lib/constants';
import { t } from '@/i18n';
import './globals.css';

/**
 * Sets the theme attribute BEFORE the first paint.
 *
 * This has to be a blocking inline script rather than an effect: an effect runs
 * after the first paint, so a learner who chose dark would see the light
 * palette flash white and then switch on every single navigation. Reading the
 * stored value here, and falling back to the OS preference on a first visit,
 * means the correct palette is on the element before anything is drawn.
 */
const themeScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=s==='dark'||(s===null&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

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
  // The browser chrome follows the palette the learner is actually in, so the
  // address bar does not stay pale against a dark page.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f9fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${poppins.variable}`}
      // The inline script sets this before paint; React must not warn about
      // the attribute it finds already present on the element it hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
