export type CouncilRevealPhase =
  | "idle"
  | "convening"
  | "revealing"
  | "debating"
  | "chairman"
  | "done";

export type MemberDisplayStatus =
  | "idle"
  | "deliberating"
  | "revealed"
  | "error";

export interface MemberDisplayState {
  id: string;
  displayStatus: MemberDisplayStatus;
  showContent: boolean;
  isDebating: boolean;
  showDebate: boolean;
}
