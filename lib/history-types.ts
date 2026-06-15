import type { ChairmanReport, DebateResponse, MemberAnalysis } from "./types";

/** Persisted member payload — analysis + optional debate only (no UI state). */
export interface StoredMemberData {
  id: string;
  analysis: MemberAnalysis;
  debate: DebateResponse | null;
}

export interface CouncilRun {
  id: string;
  user_id: string;
  created_at: string;
  idea_text: string;
  report: ChairmanReport;
  members: StoredMemberData[];
  verdict: string;
  market_fit: number;
}

export interface CouncilRunSummary {
  id: string;
  created_at: string;
  idea_text: string;
  verdict: string;
  market_fit: number;
}
