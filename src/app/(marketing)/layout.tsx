import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingChrome } from '@/components/marketing/chrome';

/**
 * The marketing site uses Archivo on #FBFBF9. The app, auth, and editor keep
 * their own typography — this wrapper is the only place the switch happens.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mk-page font-archivo text-ink">
      <MarketingNav />
      <MarketingChrome />
      <main id="main">{children}</main>
      <MarketingFooter />
    </div>
  );
}
