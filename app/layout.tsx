import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Newsreader, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

/**
 * Self-hosted at build time by next/font — no third-party font request at
 * runtime, and no layout shift from a late-arriving face.
 */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-newsreader',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PortionPair — Same meals. Different goals.',
  description: 'One shared household meal plan with personalized portions.',
};

export const viewport: Viewport = {
  themeColor: '#fbf9f5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${newsreader.variable} ${ibmPlexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
