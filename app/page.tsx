"use client";

import { COUNCIL_MEMBERS } from "@/lib/council-members";
import type {
  ChairmanReport,
  CouncilSessionState,
  DebateResponse,
  MemberAnalysis,
  MemberState,
  SSEEvent,
} from "@/lib/types";
import { useCallback, useState } from "react";
import { ChairmanQA } from "@/components/ChairmanQA";
import { CouncilGrid } from "@/components/CouncilGrid";
import { FinalReport } from "@/components/FinalReport";
import { IdeaInput } from "@/components/IdeaInput";
import { ProviderSettingsPanel, useProviderSettings } from "@/components/ProviderSettings";
import { useCouncilReveal } from "@/hooks/useCouncilReveal";
import { clearCustomApiKey } from "@/lib/client-provider-settings";

function createInitialMembers(): MemberState[] {
  return COUNCIL_MEMBERS.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    color: m.color,
    icon: m.icon,
    status: "idle",
    streamText: "",
    analysis: null,
    debate: null,
    error: null,
  }));
}

const INITIAL_STATE: CouncilSessionState = {
  idea: "",
  enableDebate: false,
  members: createInitialMembers(),
  chairmanStatus: "idle",
  chairmanStreamText: "",
  report: null,
  chairmanError: null,
  isRunning: false,
  isComplete: false,
};

export default function Home() {
  const [state, setState] = useState<CouncilSessionState>(INITIAL_STATE);
  const { settings: providerSettings, updateSettings } = useProviderSettings();
  const [providerError, setProviderError] = useState<string | null>(null);

  const updateMember = useCallback(
    (memberId: string, patch: Partial<MemberState>) => {
      setState((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId ? { ...m, ...patch } : m
        ),
      }));
    },
    []
  );

  const handleEvent = useCallback(
    (event: SSEEvent) => {
      switch (event.type) {
        case "member_start":
          if (event.memberId) {
            updateMember(event.memberId, {
              status: "loading",
              streamText: "",
              analysis: null,
              debate: null,
              error: null,
            });
          }
          break;

        case "member_stream":
          // Buffer only — orchestration reveals parsed results, not raw tokens
          if (event.memberId) {
            updateMember(event.memberId, { status: "loading" });
          }
          break;

        case "member_complete":
          if (event.memberId) {
            updateMember(event.memberId, {
              status: "complete",
              analysis: event.data as MemberAnalysis,
            });
          }
          break;

        case "member_error":
          if (event.memberId) {
            updateMember(event.memberId, {
              status: "error",
              error: (event.data as { error: string }).error,
            });
          }
          break;

        case "debate_complete":
          if (event.memberId) {
            updateMember(event.memberId, {
              debate: event.data as DebateResponse,
            });
          }
          break;

        case "chairman_start":
          setState((prev) => ({
            ...prev,
            chairmanStatus: "loading",
            chairmanStreamText: "",
            report: null,
            chairmanError: null,
          }));
          break;

        case "chairman_stream":
          setState((prev) => ({
            ...prev,
            chairmanStatus: "loading",
          }));
          break;

        case "chairman_complete":
          setState((prev) => ({
            ...prev,
            chairmanStatus: "complete",
            report: event.data as ChairmanReport,
          }));
          break;

        case "chairman_error":
          setState((prev) => ({
            ...prev,
            chairmanStatus: "error",
            chairmanError: (event.data as { error: string }).error,
          }));
          break;

        case "done":
          setState((prev) => ({
            ...prev,
            isRunning: false,
            isComplete: true,
          }));
          break;
      }
    },
    [updateMember]
  );

  const runCouncil = async (idea: string, enableDebate: boolean) => {
    setProviderError(null);
    setState({
      ...INITIAL_STATE,
      idea,
      enableDebate,
      members: createInitialMembers(),
      isRunning: true,
    });

    try {
      const response = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, enableDebate, provider: providerSettings }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as SSEEvent;
              handleEvent(event);
            } catch {
              // skip malformed events
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setProviderError(
        providerSettings.mode === "custom" ? message : null
      );
      setState((prev) => ({
        ...prev,
        isRunning: false,
        chairmanStatus: "error",
        chairmanError: message,
      }));
    }
  };

  const handleRevertProvider = () => {
    const reset = clearCustomApiKey();
    updateSettings(reset);
    setProviderError(null);
  };

  const showCouncil =
    state.isRunning ||
    state.isComplete ||
    state.members.some((m) => m.status !== "idle");

  const reveal = useCouncilReveal({
    members: state.members,
    enableDebate: state.enableDebate,
    isRunning: state.isRunning,
    isComplete: state.isComplete,
    chairmanStatus: state.chairmanStatus,
    report: state.report,
    chairmanError: state.chairmanError,
    sessionActive: showCouncil,
  });

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-council-border bg-council-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">
              LLM Council
            </h1>
            <p className="text-xs text-council-muted">
              Multi-perspective idea evaluation
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <ProviderSettingsPanel
          settings={providerSettings}
          onChange={updateSettings}
          disabled={state.isRunning}
        />

        <IdeaInput
          onSubmit={runCouncil}
          isRunning={state.isRunning}
          defaultDebate={state.enableDebate}
          providerSettings={providerSettings}
          providerError={providerError}
          onRevertProvider={
            providerSettings.mode === "custom" ? handleRevertProvider : undefined
          }
        />

        {showCouncil && (
          <>
            <CouncilGrid
              members={state.members}
              memberDisplay={reveal.memberDisplay}
              revealedCount={reveal.revealedCount}
              counterPulse={reveal.counterPulse}
              showDebateBanner={reveal.showDebateBanner}
              isRunning={state.isRunning}
            />

            {reveal.showChairmanSection && (
              <>
                <FinalReport
                  status={state.chairmanStatus}
                  report={state.report}
                  error={state.chairmanError}
                  visibleSections={reveal.chairmanVisibleSections}
                  animateScores={reveal.animateChairmanScores}
                  showLoading={reveal.showChairmanLoading}
                />

                {state.report && reveal.chairmanVisibleSections >= 1 && (
                  <ChairmanQA
                    idea={state.idea}
                    report={state.report}
                    providerSettings={providerSettings}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
