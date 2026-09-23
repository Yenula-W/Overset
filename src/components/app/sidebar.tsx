'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookMarked,
  CircleHelp,
  Home,
  Languages,
  LibraryBig,
  Menu,
  Settings,
  Sparkles,
  UsersRound,
  Gauge,
  X,
} from 'lucide-react';
import { Logo } from '@/components/brand';
import { Avatar, Progress } from '@/components/ui';
import { DEMO_SUBSCRIPTION, DEMO_USAGE, DEMO_USER } from '@/lib/data/workspace';
import { planById } from '@/lib/billing';
import { cn, formatNumber, pct } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/projects', label: 'Projects', icon: LibraryBig },
  { href: '/translate', label: 'Translate', icon: Sparkles },
  { href: '/glossary', label: 'Glossary', icon: BookMarked },
  { href: '/characters', label: 'Characters', icon: UsersRound },
  { href: '/memory', label: 'Translation Memory', icon: Languages },
  { href: '/team', label: 'Team', icon: UsersRound },
  { href: '/usage', label: 'Usage', icon: Gauge },
];

const BOTTOM = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: CircleHelp },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const plan = planById(DEMO_SUBSCRIPTION.plan);
  const used = DEMO_USAGE.pagesUsed;
  const total = DEMO_USAGE.pagesIncluded;

  React.useEffect(() => setOpen(false), [pathname]);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4">
        <Logo href="/dashboard" />
        <button className="rounded-lg p-1.5 text-ink-muted lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
          <X size={17} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-4" aria-label="Workspace">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-line px-2.5 py-2">
        {BOTTOM.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
      </div>

      <Link href="/settings" className="flex items-center gap-2.5 border-t border-line px-4 py-3.5 transition-colors hover:bg-ink/[0.025]">
        <Avatar name={DEMO_USER.name} size={30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{DEMO_USER.name}</p>
          <p className="text-[11.5px] text-ink-muted">{plan.name} plan</p>
          <p className="mt-1.5 text-[11px] tabular-nums text-ink-faint">
            {formatNumber(used)} / {formatNumber(total)} pages
          </p>
          <Progress value={pct(used, total)} className="mt-1" label="Pages used this cycle" />
        </div>
      </Link>
    </div>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur-xl lg:hidden">
        <Logo href="/dashboard" />
        <button className="rounded-lg p-2 text-ink" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open}>
          <Menu size={18} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/25" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative h-full w-[280px] animate-fade-in border-r border-line bg-canvas">{content}</div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-line bg-canvas lg:block">{content}</aside>
    </>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors',
        active ? 'bg-ink/[0.055] font-medium text-ink' : 'text-ink-muted hover:bg-ink/[0.03] hover:text-ink',
      )}
    >
      <Icon size={16} className={active ? 'text-accent' : 'text-ink-faint'} />
      {label}
    </Link>
  );
}
