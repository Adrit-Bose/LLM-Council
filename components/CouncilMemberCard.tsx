"use client";

import type { MemberDisplayState } from "@/lib/animation/types";
import type { MemberState } from "@/lib/types";

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  red: { border: "border-red-500/30", bg: "bg-red-500/5", text: "text-red-400", badge: "bg-red-500/20 text-red-300" },
  blue: { border: "border-blue-500/30", bg: "bg-blue-500/5", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-300" },
  cyan: { border: "border-cyan-500/30", bg: "bg-cyan-500/5", text: "text-cyan-400", badge: "bg-cyan-500/20 text-cyan-300" },
  purple: { border: "border-purple-500/30", bg: "bg-purple-500/5", text: "text-purple-400", badge: "bg-purple-500/20 text-purple-300" },
  orange: { border: "border-orange-500/30", bg: "bg-orange-500/5", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-300" },
  green: { border: "border-green-500/30", bg: "bg-green-500/5", text: "text-green-400", badge: "bg-green-500/20 text-green-300" },
};

const VERDICT_COLORS: Record<string, string> = {
  Go: "bg-green-500/20 text-green-300 border-green-500/30",
  "No-Go": "bg-red-500/20 text-red-300 border-red-500/30",
  Pivot: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Uncertain: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

interface AnalysisListProps {
  title: string;
  items: string[];
  icon: string;
  colorClass: string;
  visible: boolean;
}

function AnalysisList({ title, items, icon, colorClass, visible }: AnalysisListProps) {
  if (!items.length || !visible) return null;
  return (
    <div className="animate-content-in">
      <h4 className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${colorClass}`}>
        {icon} {title}
      </h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-400 leading-relaxed pl-3 border-l border-council-border">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeliberatingDots() {
  return (
    <span className="deliberating-dots inline-flex gap-1 ml-1">
      <span className="w-1 h-1 rounded-full bg-council-accent inline-block" />
      <span className="w-1 h-1 rounded-full bg-council-accent inline-block" />
      <span className="w-1 h-1 rounded-full bg-council-accent inline-block" />
    </span>
  );
}

interface CouncilMemberCardProps {
  member: MemberState;
  display: MemberDisplayState;
  interruptedMessage?: string;
}

export function CouncilMemberCard({
  member,
  display,
  interruptedMessage,
}: CouncilMemberCardProps) {
  const colors = COLOR_MAP[member.color] ?? COLOR_MAP.blue;
  const isDeliberating = display.displayStatus === "deliberating";
  const isRevealed = display.displayStatus === "revealed";
  const isError = display.displayStatus === "error";
  const showAnalysis = isRevealed && member.analysis && display.showContent;

  return (
    <div
      className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 flex flex-col gap-3
                  transition-[box-shadow,opacity,transform] duration-300
                  ${isDeliberating ? "animate-deliberating-glow" : ""}
                  ${display.isDebating ? "ring-2 ring-council-accent/40" : ""}
                  ${isRevealed ? "animate-slide-up-fade opacity-100" : ""}
                  ${isDeliberating ? "opacity-95" : ""}`}
    >
      {/* Header — always visible during deliberation */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{member.icon}</span>
          <div>
            <h3 className="font-display font-semibold text-sm">{member.name}</h3>
            <p className="text-xs text-council-muted">{member.role}</p>
          </div>
        </div>

        {showAnalysis && member.analysis && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 animate-content-in
                        ${VERDICT_COLORS[member.analysis.verdict] ?? VERDICT_COLORS.Uncertain}`}
          >
            {member.analysis.verdict}
          </span>
        )}
      </div>

      {display.displayStatus === "idle" && (
        <p className="text-xs text-slate-600 italic">Awaiting session…</p>
      )}

      {isDeliberating && (
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-council-muted">
              Deliberating
              <DeliberatingDots />
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-3 rounded-md animate-shimmer w-full" />
            <div className="h-3 rounded-md animate-shimmer w-4/5" />
            <div className="h-3 rounded-md animate-shimmer w-3/5" />
          </div>
        </div>
      )}

      {isError && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-3 border border-red-500/20 animate-content-in">
          ⚠️ {member.error || interruptedMessage || "Analysis could not be completed."}
        </div>
      )}

      {showAnalysis && member.analysis && (
        <div className="space-y-3 flex-1">
          <p className="text-xs text-slate-300 leading-relaxed border-b border-council-border pb-3 animate-content-in">
            {member.analysis.summary}
          </p>

          <div className="grid grid-cols-1 gap-3">
            <AnalysisList title="Strengths" items={member.analysis.strengths} icon="✓" colorClass="text-green-400" visible={display.showContent} />
            <AnalysisList title="Weaknesses" items={member.analysis.weaknesses} icon="✗" colorClass="text-red-400" visible={display.showContent} />
            <AnalysisList title="Risks" items={member.analysis.risks} icon="⚡" colorClass="text-amber-400" visible={display.showContent} />
            <AnalysisList title="Opportunities" items={member.analysis.opportunities} icon="★" colorClass="text-blue-400" visible={display.showContent} />
          </div>
        </div>
      )}

      {display.showDebate && member.debate && (
        <div className="border-t border-council-border pt-3 space-y-2 animate-content-in transition-opacity duration-300">
          <h4 className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
            Debate Contributions
          </h4>
          {member.debate.rebuttals.map((r, i) => (
            <div key={i} className="text-xs space-y-0.5">
              <p className="text-slate-500">
                → <span className="text-slate-400">{r.targetMember}</span>: {r.point}
              </p>
              <p className="text-slate-300 pl-3 border-l border-council-border">{r.response}</p>
            </div>
          ))}
          <p className="text-xs text-slate-400 italic mt-2">{member.debate.revisedStance}</p>
        </div>
      )}
    </div>
  );
}
