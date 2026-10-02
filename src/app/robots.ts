import type { MetadataRoute } from 'next';

// The workspace, editor and API are private; only the public site is indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/dashboard', '/projects', '/translate', '/glossary', '/characters', '/memory', '/team', '/usage', '/settings', '/onboarding', '/reset-password'],
    },
    sitemap: 'https://useoverset.com/sitemap.xml',
  };
}
