'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { subscribe, type StoreName } from './db';
import { currentUser } from './auth';
import type { PublicUser } from './schema';

/* ---------------------------------------------------------------- session */

interface SessionValue {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = React.createContext<SessionValue>({ user: null, loading: true, refresh: async () => {} });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<PublicUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      setUser(await currentUser());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    const unsub = subscribe((store) => {
      if (store === 'users') void refresh();
    });
    // Session changes in another tab arrive as storage events.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'overset.session') void refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsub();
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const value = React.useMemo(() => ({ user, loading, refresh }), [user, loading, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return React.useContext(SessionContext);
}

/** The signed-in user. Only call beneath <RequireAuth>, where it is never null. */
export function useUser(): PublicUser {
  const { user } = useSession();
  if (!user) throw new Error('useUser() called outside an authenticated route.');
  return user;
}

/**
 * Gate for every workspace route. Unauthenticated visitors go to /login and
 * come back to the page they asked for; users mid-onboarding finish it first.
 */
export function RequireAuth({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!user.onboardingComplete && pathname !== '/onboarding') router.replace('/onboarding');
  }, [user, loading, router, pathname]);

  if (loading || !user || (!user.onboardingComplete && pathname !== '/onboarding')) {
    return <>{fallback ?? <FullPageLoading />}</>;
  }
  return <>{children}</>;
}

/** Login and signup bounce signed-in users to where they were going. */
export function RedirectIfSignedIn({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  React.useEffect(() => {
    if (loading || !user) return;
    const next = new URLSearchParams(window.location.search).get('next');
    router.replace(user.onboardingComplete ? safeNext(next) : '/onboarding');
  }, [user, loading, router]);
  if (loading || user) return <FullPageLoading />;
  return <>{children}</>;
}

/** Only same-site paths are honored, so `?next=` can't send people elsewhere. */
export function safeNext(next: string | null, fallback = '/dashboard') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}

function FullPageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <span className="flex items-center gap-2.5 text-[13px] text-ink-muted">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
        Opening your workspace…
      </span>
    </div>
  );
}

/* ----------------------------------------------------------- live queries */

export interface Live<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Runs `query` and re-runs it whenever one of `stores` changes — in this tab
 * or another one. Stale results from superseded runs are discarded.
 */
export function useLiveQuery<T>(query: () => Promise<T>, deps: React.DependencyList, stores: StoreName[]): Live<T> {
  const [state, setState] = React.useState<{ data: T | undefined; loading: boolean; error: Error | null }>({
    data: undefined,
    loading: true,
    error: null,
  });
  const runId = React.useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = React.useCallback(query, deps);
  const storeKey = stores.join(',');

  const execute = React.useCallback(() => {
    const id = ++runId.current;
    run().then(
      (data) => {
        if (id === runId.current) setState({ data, loading: false, error: null });
      },
      (error: unknown) => {
        if (id === runId.current) setState((s) => ({ data: s.data, loading: false, error: error instanceof Error ? error : new Error(String(error)) }));
      },
    );
  }, [run]);

  React.useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    execute();
    const watched = new Set(storeKey.split(','));
    return subscribe((store) => {
      if (watched.has(store)) execute();
    });
  }, [execute, storeKey]);

  return { ...state, reload: execute };
}

/** Object URL for a stored blob, revoked when it changes or unmounts. */
export function useObjectUrl(blob: Blob | undefined | null) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
