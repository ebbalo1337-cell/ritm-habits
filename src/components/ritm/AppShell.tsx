import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, Leaf } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { HabitsProvider } from "./habits-context";

const tab =
  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <HabitsProvider>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:shadow-soft"
      >
        К содержимому
      </a>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3 pt-6 sm:pt-10">
          <Link to="/" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Ритм</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">Маленькие шаги каждый день</span>
          </Link>
          <nav aria-label="Разделы" className="flex gap-1 rounded-full bg-card p-1 shadow-soft">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className={tab}
              activeProps={{ className: "bg-gradient-primary text-primary-foreground", "aria-current": "page" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-accent hover:text-accent-foreground" }}
            >
              <Leaf className="size-4" aria-hidden />
              Сегодня
            </Link>
            <Link
              to="/stats"
              className={tab}
              activeProps={{ className: "bg-gradient-primary text-primary-foreground", "aria-current": "page" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-accent hover:text-accent-foreground" }}
            >
              <BarChart3 className="size-4" aria-hidden />
              Статистика
            </Link>
          </nav>
        </header>
        <main id="content" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
      </div>
      <Toaster position="top-center" />
    </HabitsProvider>
  );
}
