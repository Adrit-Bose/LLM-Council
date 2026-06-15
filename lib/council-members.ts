/**
 * Council member definitions.
 *
 * To customize a member:
 *   - Change `model` to any OpenAI-compatible model name
 *   - Edit `systemPrompt` to shift their analytical lens
 *   - Override per-member via env vars (see .env.example)
 *
 * To add a new member, append an entry and update MEMBER_META in components.
 */

import type { ProviderSettings } from "./provider-config";
import {
  CURSOR_CHAIRMAN_MODEL,
  CURSOR_MEMBER_MODEL,
  CUSTOM_PROVIDER_CHAIRMAN_MODELS,
  CUSTOM_PROVIDER_DEFAULT_MODELS,
} from "./provider-config";

export interface CouncilMemberConfig {
  id: string;
  name: string;
  role: string;
  /** Tailwind color token for UI accents */
  color: string;
  icon: string;
  /** Model name for custom OpenAI-style providers — overridden in Cursor mode */
  model: string;
  systemPrompt: string;
}

/** Resolve the model id for a council member given active provider settings */
export function resolveMemberModel(
  member: CouncilMemberConfig,
  settings: ProviderSettings
): string {
  if (settings.mode === "cursor") {
    return (
      process.env[`${member.id.toUpperCase().replace(/-/g, "_")}_MODEL`] ||
      CURSOR_MEMBER_MODEL
    );
  }
  if (settings.model?.trim()) return settings.model.trim();
  const provider = settings.customProvider || "openai";
  return (
    process.env[`${member.id.toUpperCase().replace(/-/g, "_")}_MODEL`] ||
    process.env.DEFAULT_MODEL ||
    CUSTOM_PROVIDER_DEFAULT_MODELS[provider]
  );
}

/** Resolve chairman model for active provider */
export function resolveChairmanModel(settings: ProviderSettings): string {
  if (settings.mode === "cursor") {
    return process.env.CHAIRMAN_MODEL || CURSOR_CHAIRMAN_MODEL;
  }
  if (settings.chairmanModel?.trim()) return settings.chairmanModel.trim();
  const provider = settings.customProvider || "openai";
  return (
    process.env.CHAIRMAN_MODEL ||
    process.env.DEFAULT_MODEL ||
    CUSTOM_PROVIDER_CHAIRMAN_MODELS[provider]
  );
}

const JSON_INSTRUCTION = `
You MUST respond with valid JSON only — no markdown fences, no preamble.
Use this exact schema:
{
  "strengths": ["string"],
  "weaknesses": ["string"],
  "risks": ["string"],
  "opportunities": ["string"],
  "verdict": "Go" | "No-Go" | "Pivot" | "Uncertain",
  "summary": "2-3 sentence overview of your assessment"
}`;

export const COUNCIL_MEMBERS: CouncilMemberConfig[] = [
  {
    id: "skeptic",
    name: "The Skeptic",
    role: "Feasibility & Assumptions",
    color: "red",
    icon: "🔍",
    model: process.env.SKEPTIC_MODEL || process.env.DEFAULT_MODEL || "gpt-4o-mini",
    systemPrompt: `You are The Skeptic on an LLM Council evaluating startup/business ideas.
Your job is to attack feasibility, expose hidden assumptions, and enumerate failure modes.
Be rigorous and evidence-oriented. Challenge optimistic claims.
Find what could go wrong that others might overlook.
${JSON_INSTRUCTION}`,
  },
  {
    id: "market-analyst",
    name: "The Market Analyst",
    role: "Market Fit & Competition",
    color: "blue",
    icon: "📊",
    model: process.env.MARKET_ANALYST_MODEL || process.env.DEFAULT_MODEL || "gpt-4o-mini",
    systemPrompt: `You are The Market Analyst on an LLM Council evaluating startup/business ideas.
Evaluate current market fit, competition landscape, demand signals, and timing.
Assess TAM/SAM/SOM qualitatively, identify key competitors, and judge market readiness.
${JSON_INSTRUCTION}`,
  },
  {
    id: "technologist",
    name: "The Technologist",
    role: "Technical Viability",
    color: "cyan",
    icon: "⚙️",
    model: process.env.TECHNOLOGIST_MODEL || process.env.DEFAULT_MODEL || "gpt-4o-mini",
    systemPrompt: `You are The Technologist on an LLM Council evaluating startup/business ideas.
Assess technical viability, implementation complexity, infrastructure costs, and scalability.
Identify build-vs-buy tradeoffs, technical debt risks, and engineering talent requirements.
${JSON_INSTRUCTION}`,
  },
  {
    id: "visionary",
    name: "The Visionary",
    role: "Future Potential",
    color: "purple",
    icon: "🔮",
    model: process.env.VISIONARY_MODEL || process.env.DEFAULT_MODEL || "gpt-4o-mini",
    systemPrompt: `You are The Visionary on an LLM Council evaluating startup/business ideas.
Explore long-term potential, future scope expansion, and adjacent opportunities.
Think 5-10 years ahead. Identify platform plays and second-order effects.
${JSON_INSTRUCTION}`,
  },
  {
    id: "devils-advocate",
    name: "The Devil's Advocate",
    role: "Strongest Failure Case",
    color: "orange",
    icon: "😈",
    model: process.env.DEVILS_ADVOCATE_MODEL || process.env.DEFAULT_MODEL || "gpt-4o-mini",
    systemPrompt: `You are The Devil's Advocate on an LLM Council evaluating startup/business ideas.
Argue the STRONGEST possible case for why this idea will fail.
Steel-man the opposition. Be provocative but intellectually honest.
Your goal is to stress-test the idea by presenting the most compelling counter-narrative.
${JSON_INSTRUCTION}`,
  },
  {
    id: "pragmatist",
    name: "The Pragmatist",
    role: "ROI & Execution",
    color: "green",
    icon: "🎯",
    model: process.env.PRAGMATIST_MODEL || process.env.DEFAULT_MODEL || "gpt-4o-mini",
    systemPrompt: `You are The Pragmatist on an LLM Council evaluating startup/business ideas.
Weigh ROI, resource requirements, and realistic execution paths.
Focus on what can actually be built with limited capital and time.
Propose concrete next steps and MVP scope.
${JSON_INSTRUCTION}`,
  },
];

/** Chairman synthesizes all council perspectives into a final report */
export const CHAIRMAN_CONFIG = {
  id: "chairman",
  name: "The Chairman",
  model: process.env.CHAIRMAN_MODEL || process.env.DEFAULT_MODEL || "gpt-4o",
  systemPrompt: `You are The Chairman of an LLM Council. You have received analyses from six council members
(Skeptic, Market Analyst, Technologist, Visionary, Devil's Advocate, Pragmatist) about a business idea.

Synthesize their perspectives into a balanced, actionable final report.
Weigh disagreements thoughtfully. Your verdict should reflect the preponderance of evidence.

You MUST respond with valid JSON only — no markdown fences, no preamble.
Use this exact schema:
{
  "executiveSummary": "string",
  "consolidatedAdvantages": ["string"],
  "consolidatedDisadvantages": ["string"],
  "futureScopeAndScalability": "string",
  "marketFitScore": 0-100,
  "marketFitAnalysis": "string",
  "verdict": "Go" | "No-Go" | "Pivot",
  "verdictReasoning": "string",
  "scores": {
    "feasibility": 0-100,
    "marketDemand": 0-100,
    "innovation": 0-100,
    "profitability": 0-100,
    "risk": 0-100
  }
}`,
};

const DEBATE_JSON_INSTRUCTION = `
You MUST respond with valid JSON only — no markdown fences, no preamble.
Use this exact schema:
{
  "rebuttals": [
    { "targetMember": "member name", "point": "point being rebutted", "response": "your rebuttal" }
  ],
  "revisedStance": "1-2 sentence updated position after considering other members"
}`;

/** Build debate prompt for a member given all prior analyses */
export function buildDebatePrompt(
  member: CouncilMemberConfig,
  idea: string,
  allAnalyses: { memberName: string; analysis: string }[]
): string {
  const others = allAnalyses
    .filter((a) => a.memberName !== member.name)
    .map((a) => `### ${a.memberName}\n${a.analysis}`)
    .join("\n\n");

  return `You are ${member.name}. You previously analyzed this idea:

IDEA: ${idea}

YOUR PRIOR ANALYSIS has been shared with the council. Here are the other members' analyses:

${others}

In this debate round, selectively rebut or concede points from other members.
Focus on the most important disagreements. 2-4 rebuttals maximum.
${DEBATE_JSON_INSTRUCTION}`;
}

export function buildAnalysisUserPrompt(idea: string): string {
  return `Evaluate the following idea:\n\n${idea}`;
}

export function buildChairmanUserPrompt(
  idea: string,
  analyses: { memberName: string; analysis: unknown; debate?: unknown }[]
): string {
  const sections = analyses
    .map((a) => {
      let text = `### ${a.memberName}\n${JSON.stringify(a.analysis, null, 2)}`;
      if (a.debate) {
        text += `\n\nDebate contributions:\n${JSON.stringify(a.debate, null, 2)}`;
      }
      return text;
    })
    .join("\n\n");

  return `IDEA:\n${idea}\n\nCOUNCIL ANALYSES:\n\n${sections}\n\nProduce the final synthesized report.`;
}
