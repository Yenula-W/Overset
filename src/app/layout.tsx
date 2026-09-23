import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://panelflow.ai'),
  title: {
    default: 'PanelFlow — Translate the story. Preserve the panel.',
    template: '%s · PanelFlow',
  },
  description:
    'PanelFlow is an AI localization workspace for manhwa, webtoons, manga, and comics. Detect, translate, clean, and typeset every panel while keeping the original artwork intact.',
  openGraph: {
    title: 'PanelFlow — Translate the story. Preserve the panel.',
    description:
      'Upload a chapter. PanelFlow detects, translates, cleans, and typesets every panel while preserving context, terminology, character voice, and the original artwork.',
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
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
