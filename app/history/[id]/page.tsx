"use client";

import { AppHeader } from "@/components/AppHeader";
import { CouncilSessionView } from "@/components/CouncilSessionView";
import { useProviderSettings } from "@/components/ProviderSettings";
import { VerdictBadge } from "@/components/VerdictBadge";
import { fetchCouncilRun, formatRunDate } from "@/lib/history";
import type { CouncilRun } from "@/lib/history-types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { settings: providerSettings } = useProviderSettings();

  const [run, setRun] = useState<CouncilRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCouncilRun(id);
        if (!cancelled) {
          if (!data) setError("Council run not found.");
          else setRun(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load run");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/history"
            className="text-council-accent hover:text-council-accentHover"
          >
            ← History
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-council-accent/30 border-t-council-accent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {run && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold">Saved evaluation</h2>
              <VerdictBadge verdict={run.verdict} />
              <span className="text-sm text-council-muted">
                {formatRunDate(run.created_at)}
              </span>
            </div>

            <CouncilSessionView
              idea={run.idea_text}
              run={run}
              providerSettings={providerSettings}
              showChairmanQA
            />
          </>
        )}
      </div>
    </main>
  );
}
