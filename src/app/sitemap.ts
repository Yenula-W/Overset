import type { MetadataRoute } from 'next';

const SITE = 'https://useoverset.com';
const PAGES = ['', '/how-it-works', '/pricing', '/teams', '/about', '/resources', '/docs', '/help', '/changelog', '/contact', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({ url: `${SITE}${path}`, changeFrequency: 'weekly', priority: path === '' ? 1 : 0.6 }));
}
