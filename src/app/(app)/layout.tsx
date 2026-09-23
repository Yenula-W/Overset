import { AppSidebar } from '@/components/app/sidebar';
import { ToastProvider } from '@/components/ui';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-canvas">
        <AppSidebar />
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
