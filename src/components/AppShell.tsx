import { Link, useRouterState } from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { Brain, House, ChartColumn } from 'lucide-react';
import { cn } from '@/lib/utils';

function useCurrentPath() {
  const state = useRouterState();
  return state.location.pathname;
}

function BottomNav() {
  const path = useCurrentPath();

  const navItems = [
    { to: '/' as const, label: '홈', icon: House },
    { to: '/progress' as const, label: '진도', icon: ChartColumn },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card sm:hidden">
      <div className="mx-auto flex max-w-screen-sm">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? path === '/' : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-sm items-center justify-between px-4 py-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary">
            <Brain className="size-5" />
            <span>암산 학습</span>
          </Link>
          {/* Desktop nav — hidden on mobile (bottom nav handles that) */}
          <nav className="hidden gap-4 text-sm sm:flex">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              홈
            </Link>
            <Link to="/progress" className="text-muted-foreground hover:text-foreground transition-colors">
              학습 진도
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 pb-20 pt-2.5 sm:pb-8">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
