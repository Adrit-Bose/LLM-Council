"use client";

import type { ProviderSettings } from "@/lib/provider-config";
import { useState } from "react";

interface IdeaInputProps {
  onSubmit: (idea: string, enableDebate: boolean) => void;
  isRunning: boolean;
  defaultDebate?: boolean;
  providerSettings: ProviderSettings;
  providerError?: string | null;
  onRevertProvider?: () => void;
}

export function IdeaInput({
  onSubmit,
  isRunning,
  defaultDebate = false,
  providerSettings,
  providerError,
  onRevertProvider,
}: IdeaInputProps) {
  const [idea, setIdea] = useState("");
  const [enableDebate, setEnableDebate] = useState(defaultDebate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = idea.trim();
    if (!trimmed || isRunning) return;
    onSubmit(trimmed, enableDebate);
  };

  return (
    <section className="bg-council-surface border border-council-border rounded-2xl p-6 shadow-xl">
      <h2 className="font-display text-lg font-semibold mb-1">Submit Your Idea</h2>
      <p className="text-sm text-council-muted mb-4">
        Describe a business idea, product concept, or venture. The council will evaluate it from six distinct perspectives.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {providerError && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 space-y-2">
            <p>⚠️ {providerError}</p>
            {onRevertProvider && (
              <button
                type="button"
                onClick={onRevertProvider}
                className="text-xs underline hover:text-red-300"
              >
                Switch back to Cursor default
              </button>
            )}
          </div>
        )}

        {providerSettings.mode === "custom" && !providerSettings.apiKey?.trim() && (
          <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Custom mode selected — enter an API key in LLM settings above.
          </p>
        )}

        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. A mobile app that uses AI to negotiate bill reductions with service providers on behalf of consumers..."
          rows={5}
          disabled={isRunning}
          className="w-full bg-council-bg border border-council-border rounded-xl px-4 py-3 text-sm
                     placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-council-accent/50
                     focus:border-council-accent resize-none disabled:opacity-50 transition"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableDebate}
              onChange={(e) => setEnableDebate(e.target.checked)}
              disabled={isRunning}
              className="w-4 h-4 rounded border-council-border bg-council-bg text-council-accent
                         focus:ring-council-accent focus:ring-offset-0"
            />
            <span className="text-sm text-council-muted">
              Enable debate round
              <span className="block text-xs text-slate-600">
                Members rebut each other before the Chairman synthesizes
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={
              !idea.trim() ||
              isRunning ||
              (providerSettings.mode === "custom" && !providerSettings.apiKey?.trim())
            }
            className="px-6 py-2.5 bg-council-accent hover:bg-council-accentHover text-white text-sm
                       font-medium rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 min-w-[160px]"
          >
            {isRunning ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Council in session…
              </>
            ) : (
              <>Convene Council</>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
