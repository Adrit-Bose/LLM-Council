"use client";

import type { ProviderSettings } from "@/lib/provider-config";
import {
  hasDebate,
  staticMemberDisplay,
  storedToMemberStates,
} from "@/lib/history";
import type { CouncilRun } from "@/lib/history-types";
import { ChairmanQA } from "./ChairmanQA";
import { CouncilGrid } from "./CouncilGrid";
import { FinalReport } from "./FinalReport";

interface CouncilSessionViewProps {
  idea: string;
  run: CouncilRun;
  providerSettings?: ProviderSettings;
  showChairmanQA?: boolean;
}

export function CouncilSessionView({
  idea,
  run,
  providerSettings,
  showChairmanQA = false,
}: CouncilSessionViewProps) {
  const members = storedToMemberStates(run.members);
  const memberDisplay = staticMemberDisplay(members);
  const enableDebate = hasDebate(run.members);

  return (
    <div className="space-y-8">
      <section className="bg-council-surface border border-council-border rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold mb-2">Idea</h2>
        <p className="text-sm text-slate-300 whitespace-pre-wrap">{idea}</p>
      </section>

      <CouncilGrid
        members={members}
        memberDisplay={memberDisplay}
        revealedCount={members.filter((m) => m.status === "complete").length}
        counterPulse={false}
        showDebateBanner={enableDebate}
        isRunning={false}
      />

      <FinalReport
        status="complete"
        report={run.report}
        error={null}
        visibleSections={5}
        animateScores={false}
        showLoading={false}
      />

      {showChairmanQA && providerSettings && (
        <ChairmanQA
          idea={idea}
          report={run.report}
          providerSettings={providerSettings}
        />
      )}
    </div>
  );
}
