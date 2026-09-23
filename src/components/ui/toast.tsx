'use client';

import * as React from 'react';
import { Check, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'ok' | 'info' | 'warn';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

const ToastContext = React.createContext<(t: Omit<ToastItem, 'id'>) => void>(() => {});

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 5000);
  }, []);

  const icons: Record<ToastTone, React.ReactNode> = {
    ok: <Check size={14} className="text-ok" />,
    info: <Info size={14} className="text-accent" />,
    warn: <AlertTriangle size={14} className="text-warn" />,
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn('pointer-events-auto flex animate-fade-up items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-lift')}
          >
            {icons[item.tone]}
            <span className="flex-1 text-[13px] text-ink">{item.message}</span>
            {item.action && (
              <button onClick={item.action.onClick} className="text-[12px] font-semibold text-accent hover:underline">
                {item.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
