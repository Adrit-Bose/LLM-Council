import { z } from "zod";

/** Structured analysis returned by each council member */
export const MemberAnalysisSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  risks: z.array(z.string()),
  opportunities: z.array(z.string()),
  verdict: z.enum(["Go", "No-Go", "Pivot", "Uncertain"]),
  summary: z.string(),
});

export type MemberAnalysis = z.infer<typeof MemberAnalysisSchema>;

/** Debate rebuttal from a council member */
export const DebateResponseSchema = z.object({
  rebuttals: z.array(
    z.object({
      targetMember: z.string(),
      point: z.string(),
      response: z.string(),
    })
  ),
  revisedStance: z.string(),
});

export type DebateResponse = z.infer<typeof DebateResponseSchema>;

/** Final report synthesized by the Chairman */
export const ChairmanReportSchema = z.object({
  executiveSummary: z.string(),
  consolidatedAdvantages: z.array(z.string()),
  consolidatedDisadvantages: z.array(z.string()),
  futureScopeAndScalability: z.string(),
  marketFitScore: z.number().min(0).max(100),
  marketFitAnalysis: z.string(),
  verdict: z.enum(["Go", "No-Go", "Pivot"]),
  verdictReasoning: z.string(),
  scores: z.object({
    feasibility: z.number().min(0).max(100),
    marketDemand: z.number().min(0).max(100),
    innovation: z.number().min(0).max(100),
    profitability: z.number().min(0).max(100),
    risk: z.number().min(0).max(100),
  }),
});

export type ChairmanReport = z.infer<typeof ChairmanReportSchema>;

export type { FollowUpMessage, FollowUpRole } from "./chairman-qa";

/** SSE event types streamed to the frontend */
export type SSEEventType =
  | "member_start"
  | "member_stream"
  | "member_complete"
  | "member_error"
  | "debate_start"
  | "debate_complete"
  | "debate_error"
  | "chairman_start"
  | "chairman_stream"
  | "chairman_complete"
  | "chairman_error"
  | "done";

export interface SSEEvent {
  type: SSEEventType;
  memberId?: string;
  data?: unknown;
}

export type MemberStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "complete"
  | "error";

export interface MemberState {
  id: string;
  name: string;
  role: string;
  color: string;
  icon: string;
  status: MemberStatus;
  streamText: string;
  analysis: MemberAnalysis | null;
  debate: DebateResponse | null;
  error: string | null;
}

export interface CouncilSessionState {
  idea: string;
  enableDebate: boolean;
  members: MemberState[];
  chairmanStatus: MemberStatus;
  chairmanStreamText: string;
  report: ChairmanReport | null;
  chairmanError: string | null;
  isRunning: boolean;
  isComplete: boolean;
}
