import { AppSidebar } from '@/components/app/sidebar';
import { ToastProvider } from '@/components/ui';
import { RequireAuth, SessionProvider } from '@/lib/store/hooks';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <RequireAuth>
          {/* Column on small screens so the mobile bar stacks above the content
              instead of sitting beside it; row once the sidebar appears. */}
          <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
            <AppSidebar />
            <main id="main" className="min-w-0 flex-1">
              {children}
            </main>
          </div>
        </RequireAuth>
      </ToastProvider>
    </SessionProvider>
  );
}
