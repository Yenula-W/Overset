import { ToastProvider } from '@/components/ui';
import { RequireAuth, SessionProvider } from '@/lib/store/hooks';

/**
 * The editor takes the whole viewport. Losing 250px of artwork to workspace
 * navigation is a bad trade on the one screen where the page is the work.
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <RequireAuth>
          <div id="main">{children}</div>
        </RequireAuth>
      </ToastProvider>
    </SessionProvider>
  );
}
