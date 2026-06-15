"use client";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { COUNCIL_MEMBERS } from "@/lib/council-members";
import { saveCouncilRun } from "@/lib/history";
import type {
  ChairmanReport,
  CouncilSessionState,
  DebateResponse,
  MemberAnalysis,
  MemberState,
  SSEEvent,
} from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChairmanQA } from "@/components/ChairmanQA";
import { CouncilGrid } from "@/components/CouncilGrid";
import { FinalReport } from "@/components/FinalReport";
import { IdeaInput } from "@/components/IdeaInput";
import { ProviderSettingsPanel, useProviderSettings } from "@/components/ProviderSettings";
import { useCouncilReveal } from "@/hooks/useCouncilReveal";

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
  const { user } = useAuth();
  const [state, setState] = useState<CouncilSessionState>(INITIAL_STATE);
  const { settings: providerSettings, updateSettings } = useProviderSettings();
  const [providerError, setProviderError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const savedRunRef = useRef(false);
  const sessionIdRef = useRef(0);

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
    setHistoryError(null);
    savedRunRef.current = false;
    sessionIdRef.current += 1;

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
      setProviderError(message);
      setState((prev) => ({
        ...prev,
        isRunning: false,
        chairmanStatus: "error",
        chairmanError: message,
      }));
    }
  };

  useEffect(() => {
    if (!state.isComplete || !state.report || !user || savedRunRef.current) {
      return;
    }

    savedRunRef.current = true;
    const sessionId = sessionIdRef.current;

    saveCouncilRun(user.id, state)
      .then(() => {
        if (sessionId !== sessionIdRef.current) return;
        setHistoryError(null);
      })
      .catch((err) => {
        if (sessionId !== sessionIdRef.current) return;
        savedRunRef.current = false;
        setHistoryError(
          err instanceof Error ? err.message : "Failed to save to history"
        );
      });
  }, [state.isComplete, state.report, user, state]);

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
      <AppHeader />

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
        />

        {historyError && (
          <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Council completed but could not save to history: {historyError}
          </p>
        )}

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
