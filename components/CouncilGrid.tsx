"use client";

import type { MemberDisplayState } from "@/lib/animation/types";
import type { MemberState } from "@/lib/types";
import { CouncilMemberCard } from "./CouncilMemberCard";
import { COUNCIL_MEMBERS } from "@/lib/council-members";

interface CouncilGridProps {
  members: MemberState[];
  memberDisplay: MemberDisplayState[];
  revealedCount: number;
  counterPulse: boolean;
  showDebateBanner: boolean;
  isRunning: boolean;
}

export function CouncilGrid({
  members,
  memberDisplay,
  revealedCount,
  counterPulse,
  showDebateBanner,
  isRunning,
}: CouncilGridProps) {
  const total = members.length;

  const displayById = new Map(memberDisplay.map((d) => [d.id, d]));

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="font-display text-lg font-semibold">Council Members</h2>
        <div className="flex items-center gap-2">
          {showDebateBanner && (
            <span className="text-xs text-council-accent animate-pulse-glow hidden sm:inline">
              Council is debating…
            </span>
          )}
          <span
            className={`text-xs text-council-muted bg-council-surface border border-council-border px-3 py-1 rounded-full transition-transform
                        ${counterPulse ? "animate-counter-pulse" : ""}`}
          >
            {revealedCount}/{total} analyses complete
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {COUNCIL_MEMBERS.map((config) => {
          const member = members.find((m) => m.id === config.id)!;
          const display = displayById.get(config.id) ?? {
            id: config.id,
            displayStatus: "idle" as const,
            showContent: false,
            isDebating: false,
            showDebate: false,
          };
          const interrupted =
            !isRunning &&
            display.displayStatus === "deliberating"
              ? "Analysis interrupted."
              : undefined;

          return (
            <CouncilMemberCard
              key={config.id}
              member={member}
              display={
                interrupted
                  ? { ...display, displayStatus: "error" }
                  : display
              }
              interruptedMessage={interrupted}
            />
          );
        })}
      </div>
    </section>
  );
}
