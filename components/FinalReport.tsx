"use client";

import type { ChairmanReport, MemberStatus } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";
import { CountUp } from "./CountUp";

const VERDICT_STYLES: Record<string, { bg: string; ring: string; icon: string }> = {
  Go: { bg: "bg-green-500/10 border-green-500/30", ring: "ring-green-500/20", icon: "✅" },
  "No-Go": { bg: "bg-red-500/10 border-red-500/30", ring: "ring-red-500/20", icon: "🛑" },
  Pivot: { bg: "bg-amber-500/10 border-amber-500/30", ring: "ring-amber-500/20", icon: "🔄" },
};

interface FinalReportProps {
  status: MemberStatus;
  report: ChairmanReport | null;
  error: string | null;
  visibleSections: number;
  animateScores: boolean;
  showLoading: boolean;
}

export function FinalReport({
  status,
  report,
  error,
  visibleSections,
  animateScores,
  showLoading,
}: FinalReportProps) {
  const verdictStyle = report ? VERDICT_STYLES[report.verdict] : null;
  const showSection = (index: number) => visibleSections >= index;

  return (
    <section className="animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚖️</span>
        <h2 className="font-display text-lg font-semibold">Chairman&apos;s Report</h2>
        {showLoading && (
          <span className="w-3 h-3 border-2 border-council-accent/30 border-t-council-accent rounded-full animate-spin ml-1" />
        )}
      </div>

      <div className="bg-council-surface border border-council-border rounded-2xl overflow-hidden shadow-xl">
        {error && (
          <div className="p-6 text-sm text-red-400 bg-red-500/5 border-b border-red-500/20">
            ⚠️ Chairman failed: {error}
          </div>
        )}

        {showLoading && !report && (
          <div className="p-6 space-y-3">
            <p className="text-sm text-council-muted animate-pulse-glow">
              The Chairman is synthesizing all council perspectives…
            </p>
            <div className="space-y-2">
              <div className="h-3 rounded-md animate-shimmer w-full" />
              <div className="h-3 rounded-md animate-shimmer w-5/6" />
              <div className="h-3 rounded-md animate-shimmer w-2/3" />
            </div>
          </div>
        )}

        {report && verdictStyle && (
          <div className="divide-y divide-council-border">
            {/* Section 1: Verdict banner */}
            {showSection(1) && (
              <div className={`p-6 ${verdictStyle.bg} border-b animate-slide-up-fade`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{verdictStyle.icon}</span>
                  <div>
                    <p className="text-xs text-council-muted uppercase tracking-wider">Verdict</p>
                    <p className="font-display text-2xl font-bold">{report.verdict}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-council-muted">Market Fit</p>
                    <p className="font-display text-3xl font-bold text-council-accent">
                      <CountUp value={report.marketFitScore} animate={animateScores} />
                      <span className="text-sm text-council-muted font-normal">/100</span>
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">{report.verdictReasoning}</p>
              </div>
            )}

            {/* Section 2: Executive summary */}
            {showSection(2) && (
              <div className="p-6 animate-slide-up-fade">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-council-muted mb-2">
                  Executive Summary
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{report.executiveSummary}</p>
              </div>
            )}

            {/* Section 3: Advantages & Disadvantages */}
            {showSection(3) && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up-fade">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-3">
                    ✓ Consolidated Advantages
                  </h3>
                  <ul className="space-y-2">
                    {report.consolidatedAdvantages.map((item, i) => (
                      <li key={i} className="text-sm text-slate-400 pl-3 border-l-2 border-green-500/30">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">
                    ✗ Consolidated Disadvantages
                  </h3>
                  <ul className="space-y-2">
                    {report.consolidatedDisadvantages.map((item, i) => (
                      <li key={i} className="text-sm text-slate-400 pl-3 border-l-2 border-red-500/30">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Section 4: Future scope & market */}
            {showSection(4) && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up-fade">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">
                    Future Scope & Scalability
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {report.futureScopeAndScalability}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
                    Market Fit Analysis
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{report.marketFitAnalysis}</p>
                </div>
              </div>
            )}

            {/* Section 5: Score gauges */}
            {showSection(5) && (
              <div className="p-6 bg-council-bg/50 animate-slide-up-fade">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-council-muted mb-4">
                  Key Parameters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ScoreBar label="Feasibility" value={report.scores.feasibility} animate={animateScores} animationDelay={0} />
                  <ScoreBar label="Market Demand" value={report.scores.marketDemand} animate={animateScores} animationDelay={80} />
                  <ScoreBar label="Innovation" value={report.scores.innovation} animate={animateScores} animationDelay={160} />
                  <ScoreBar label="Profitability" value={report.scores.profitability} animate={animateScores} animationDelay={240} />
                  <ScoreBar label="Risk" value={report.scores.risk} invertColor animate={animateScores} animationDelay={320} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
