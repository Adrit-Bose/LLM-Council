"use client";

import { AppHeader } from "@/components/AppHeader";
import { VerdictBadge } from "@/components/VerdictBadge";
import {
  deleteCouncilRun,
  fetchCouncilRuns,
  formatRunDate,
  truncateIdea,
} from "@/lib/history";
import type { CouncilRunSummary } from "@/lib/history-types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function HistoryPage() {
  const [runs, setRuns] = useState<CouncilRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCouncilRuns();
      setRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this council run from your history?")) return;

    setDeletingId(id);
    try {
      await deleteCouncilRun(id);
      setRuns((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete run");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">History</h2>
            <p className="text-sm text-council-muted mt-1">
              Your past council evaluations
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-council-accent hover:text-council-accentHover shrink-0"
          >
            New evaluation →
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-council-accent/30 border-t-council-accent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadRuns}
              className="text-xs underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && runs.length === 0 && (
          <div className="bg-council-surface border border-council-border rounded-2xl p-10 text-center">
            <p className="text-council-muted text-sm mb-4">
              No council runs yet. Convene the council to evaluate your first idea.
            </p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-council-accent hover:bg-council-accentHover text-white text-sm font-medium rounded-xl transition"
            >
              Convene Council
            </Link>
          </div>
        )}

        {!loading && runs.length > 0 && (
          <ul className="space-y-3">
            {runs.map((run) => (
              <li key={run.id}>
                <Link
                  href={`/history/${run.id}`}
                  className="block bg-council-surface border border-council-border rounded-2xl p-4
                             hover:border-council-accent/40 transition group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-sm text-slate-200 line-clamp-2 group-hover:text-white transition">
                        {truncateIdea(run.idea_text)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-council-muted">
                        <VerdictBadge verdict={run.verdict} />
                        <span>Market fit: {run.market_fit}/100</span>
                        <span>·</span>
                        <span>{formatRunDate(run.created_at)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(run.id, e)}
                      disabled={deletingId === run.id}
                      className="shrink-0 text-xs text-council-muted hover:text-red-400 px-2 py-1 rounded-lg
                                 hover:bg-red-500/10 transition disabled:opacity-40"
                      aria-label="Delete run"
                    >
                      {deletingId === run.id ? "…" : "Delete"}
                    </button>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
