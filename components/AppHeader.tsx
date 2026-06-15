"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const NAV = [
  { href: "/", label: "Council" },
  { href: "/history", label: "History" },
  { href: "/account", label: "Account" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-council-border bg-council-surface/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">🏛️</span>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold tracking-tight truncate">
              LLM Council
            </h1>
            <p className="text-xs text-council-muted truncate">
              Multi-perspective idea evaluation
            </p>
          </div>
        </div>

        {user && (
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            {NAV.map(({ href, label }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    active
                      ? "bg-council-accent/15 text-white"
                      : "text-council-muted hover:text-white hover:bg-council-bg/60"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => signOut()}
              className="hidden sm:inline px-3 py-1.5 text-sm text-council-muted hover:text-white rounded-lg hover:bg-council-bg/60 transition ml-1"
            >
              Sign out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
