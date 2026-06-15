import { COUNCIL_MEMBERS } from "./council-members";
import type { CouncilRun, CouncilRunSummary, StoredMemberData } from "./history-types";
import { createClient } from "./supabase/client";
import type { ChairmanReport, CouncilSessionState, MemberState } from "./types";

// LLM API keys stay in sessionStorage only — never persisted to Postgres.

export function membersToStored(members: MemberState[]): StoredMemberData[] {
  return members
    .filter((m) => m.analysis)
    .map((m) => ({
      id: m.id,
      analysis: m.analysis!,
      debate: m.debate,
    }));
}

export function storedToMemberStates(stored: StoredMemberData[]): MemberState[] {
  const byId = new Map(stored.map((s) => [s.id, s]));

  return COUNCIL_MEMBERS.map((config) => {
    const data = byId.get(config.id);
    return {
      id: config.id,
      name: config.name,
      role: config.role,
      color: config.color,
      icon: config.icon,
      status: data ? "complete" : "idle",
      streamText: "",
      analysis: data?.analysis ?? null,
      debate: data?.debate ?? null,
      error: null,
    };
  });
}

export async function saveCouncilRun(
  userId: string,
  state: CouncilSessionState
): Promise<CouncilRun | null> {
  if (!state.report) return null;

  const supabase = createClient();
  const members = membersToStored(state.members);

  const { data, error } = await supabase
    .from("council_runs")
    .insert({
      user_id: userId,
      idea_text: state.idea,
      report: state.report,
      members,
      verdict: state.report.verdict,
      market_fit: state.report.marketFitScore,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CouncilRun;
}

export async function fetchCouncilRuns(): Promise<CouncilRunSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("council_runs")
    .select("id, created_at, idea_text, verdict, market_fit")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CouncilRunSummary[];
}

export async function fetchCouncilRun(id: string): Promise<CouncilRun | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("council_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as CouncilRun;
}

export async function deleteCouncilRun(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("council_runs").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export function hasDebate(members: StoredMemberData[]): boolean {
  return members.some((m) => m.debate != null);
}

export function staticMemberDisplay(members: MemberState[]) {
  return members.map((m) => ({
    id: m.id,
    displayStatus:
      m.status === "error" ? ("error" as const) : ("revealed" as const),
    showContent: m.status === "complete",
    isDebating: false,
    showDebate: Boolean(m.debate),
  }));
}

export function formatRunDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function truncateIdea(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export type { ChairmanReport };
