import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://useoverset.com'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32 64x64' },
      { url: '/brand/overset-mark.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  title: {
    default: 'Overset — Translate the story. Preserve the panel.',
    template: '%s · Overset',
  },
  description:
    'Overset is an AI localization workspace for manhwa, webtoons, manga, and comics. Detect, translate, clean, and typeset every panel while keeping the original artwork intact.',
  openGraph: {
    title: 'Overset — Translate the story. Preserve the panel.',
    description:
      'Upload a chapter. Overset detects, translates, cleans, and typesets every panel while preserving context, terminology, character voice, and the original artwork.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#F7F7F2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Archivo:wght@400;500;600;700;800&family=Archivo+Narrow:ital,wght@0,600;0,700;1,600;1,700&family=Noto+Sans+KR:wght@600;700&family=Noto+Serif:wght@400;600;700&family=Comic+Neue:wght@400;700&family=Bangers&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-canvas"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
