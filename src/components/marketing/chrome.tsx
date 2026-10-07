'use client';

import { usePathname } from 'next/navigation';
import { ProgressiveBlur, ScrollProgressDial } from '@/components/fx';

/** Long reading pages get a scroll-progress dial; the scroll-driven home page does not. */
const READING_PAGES = ['/about', '/docs', '/help', '/privacy', '/terms', '/changelog', '/resources', '/how-it-works', '/teams'];

/** Decorative layers shared by every marketing page. */
export function MarketingChrome() {
  const pathname = usePathname();
  return (
    <>
      {/* Content softens as it slides under the sticky nav. */}
      <ProgressiveBlur className="fixed inset-x-0 top-16 z-40" height={22} color="#FBFBF9" />
      {READING_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && <ScrollProgressDial />}
    </>
  );
}
