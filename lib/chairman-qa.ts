import type { ChairmanReport } from "./types";

export type FollowUpRole = "user" | "chairman";

export interface FollowUpMessage {
  role: FollowUpRole;
  content: string;
}

/** Compact report context for follow-up calls (token-efficient) */
export interface ChairmanQAContext {
  idea: string;
  verdict: ChairmanReport["verdict"];
  executiveSummary: string;
  keyScores: ChairmanReport["scores"];
  advantages: string[];
  disadvantages: string[];
  futureScope: string;
  marketFit: number;
}

export function buildChairmanQAContext(
  idea: string,
  report: ChairmanReport
): ChairmanQAContext {
  return {
    idea,
    verdict: report.verdict,
    executiveSummary: report.executiveSummary,
    keyScores: report.scores,
    advantages: report.consolidatedAdvantages,
    disadvantages: report.consolidatedDisadvantages,
    futureScope: report.futureScopeAndScalability,
    marketFit: report.marketFitScore,
  };
}

export const CHAIRMAN_QA_SYSTEM_PROMPT = `You are the Chairman of an LLM council that has already evaluated an idea and produced a report. Answer the user's follow-up questions using the report context provided. Be direct and specific. Reference the report's verdict, scores, and reasoning where relevant. If asked about something outside the report, reason from the council's perspective but say when you're extrapolating.`;

export function buildChairmanQAUserPrompt(
  context: ChairmanQAContext,
  messages: FollowUpMessage[]
): string {
  const prior = messages.slice(0, -1);
  const latest = messages[messages.length - 1];

  const historyBlock =
    prior.length > 0
      ? `PRIOR CONVERSATION:\n${prior
          .map((m) => `${m.role === "user" ? "User" : "Chairman"}: ${m.content}`)
          .join("\n\n")}\n\n`
      : "";

  return `REPORT CONTEXT:
${JSON.stringify(context)}

${historyBlock}USER QUESTION:
${latest?.content ?? ""}`;
}

export function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: number }).status;
    if (status === 429) return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /429|rate.?limit|too many requests/i.test(msg);
}

export const RATE_LIMIT_MESSAGE =
  "Rate limit hit — wait a moment and resend.";
