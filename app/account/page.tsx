"use client";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex justify-center">
          <span className="w-8 h-8 border-2 border-council-accent/30 border-t-council-accent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "—";

  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Account</h2>
          <p className="text-sm text-council-muted mt-1">
            Your LLM Council profile
          </p>
        </div>

        <section className="bg-council-surface border border-council-border rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-xs text-council-muted mb-1">Email</p>
            <p className="text-sm font-medium">{user.email ?? "—"}</p>
          </div>

          <div>
            <p className="text-xs text-council-muted mb-1">Member since</p>
            <p className="text-sm">{createdAt}</p>
          </div>

          <div className="pt-2 border-t border-council-border">
            {/* API keys remain session-only in sessionStorage — never stored in Postgres. */}
            <p className="text-xs text-council-muted">
              LLM provider API keys are kept in your browser session only and are
              never saved to your account or database.
            </p>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="px-5 py-2.5 bg-council-bg border border-council-border rounded-xl text-sm
                       hover:border-red-500/40 hover:text-red-400 transition"
          >
            Sign out
          </button>
        </section>
      </div>
    </main>
  );
}
