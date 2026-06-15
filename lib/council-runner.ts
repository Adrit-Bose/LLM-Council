import {
  COUNCIL_MEMBERS,
  CHAIRMAN_CONFIG,
  buildAnalysisUserPrompt,
  buildChairmanUserPrompt,
  buildDebatePrompt,
  resolveChairmanModel,
  resolveMemberModel,
  type CouncilMemberConfig,
} from "./council-members";
import { callLLM } from "./llm";
import type { ProviderSettings } from "./provider-config";
import {
  MemberAnalysisSchema,
  DebateResponseSchema,
  ChairmanReportSchema,
  type SSEEvent,
} from "./types";

type EventEmitter = (event: SSEEvent) => void;

export interface CouncilRunOptions {
  idea: string;
  enableDebate: boolean;
  provider: ProviderSettings;
  emit: EventEmitter;
}

/**
 * Orchestrates the full council workflow:
 *   1. Parallel member analyses
 *   2. Optional debate round (parallel)
 *   3. Chairman synthesis
 */
export async function runCouncil(options: CouncilRunOptions): Promise<void> {
  const { idea, enableDebate, provider, emit } = options;

  const memberResults: Map<
    string,
    {
      config: CouncilMemberConfig;
      analysis: ReturnType<typeof MemberAnalysisSchema.parse>;
      debate?: ReturnType<typeof DebateResponseSchema.parse>;
    }
  > = new Map();

  await Promise.all(
    COUNCIL_MEMBERS.map((member) =>
      runMemberAnalysis(member, idea, provider, emit, memberResults)
    )
  );

  if (enableDebate) {
    const analysesForDebate = Array.from(memberResults.values()).map((r) => ({
      memberName: r.config.name,
      analysis: JSON.stringify(r.analysis),
    }));

    emit({ type: "debate_start" });

    await Promise.all(
      COUNCIL_MEMBERS.map((member) =>
        runMemberDebate(member, idea, analysesForDebate, provider, emit, memberResults)
      )
    );
  }

  await runChairman(idea, memberResults, provider, emit);

  emit({ type: "done" });
}

async function runMemberAnalysis(
  member: CouncilMemberConfig,
  idea: string,
  provider: ProviderSettings,
  emit: EventEmitter,
  results: Map<
    string,
    {
      config: CouncilMemberConfig;
      analysis: ReturnType<typeof MemberAnalysisSchema.parse>;
      debate?: ReturnType<typeof DebateResponseSchema.parse>;
    }
  >
): Promise<void> {
  emit({ type: "member_start", memberId: member.id });

  try {
    const { parsed } = await callLLM(
      MemberAnalysisSchema,
      {
        model: resolveMemberModel(member, provider),
        systemPrompt: member.systemPrompt,
        userPrompt: buildAnalysisUserPrompt(idea),
        onChunk: (chunk) => {
          emit({ type: "member_stream", memberId: member.id, data: chunk });
        },
      },
      provider
    );

    results.set(member.id, { config: member, analysis: parsed });
    emit({ type: "member_complete", memberId: member.id, data: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    emit({ type: "member_error", memberId: member.id, data: { error: message } });
  }
}

async function runMemberDebate(
  member: CouncilMemberConfig,
  idea: string,
  allAnalyses: { memberName: string; analysis: string }[],
  provider: ProviderSettings,
  emit: EventEmitter,
  results: Map<
    string,
    {
      config: CouncilMemberConfig;
      analysis: ReturnType<typeof MemberAnalysisSchema.parse>;
      debate?: ReturnType<typeof DebateResponseSchema.parse>;
    }
  >
): Promise<void> {
  const existing = results.get(member.id);
  if (!existing) return;

  try {
    const { parsed } = await callLLM(
      DebateResponseSchema,
      {
        model: resolveMemberModel(member, provider),
        systemPrompt: member.systemPrompt,
        userPrompt: buildDebatePrompt(member, idea, allAnalyses),
      },
      provider
    );

    existing.debate = parsed;
    emit({ type: "debate_complete", memberId: member.id, data: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    emit({ type: "debate_error", memberId: member.id, data: { error: message } });
  }
}

async function runChairman(
  idea: string,
  memberResults: Map<
    string,
    {
      config: CouncilMemberConfig;
      analysis: ReturnType<typeof MemberAnalysisSchema.parse>;
      debate?: ReturnType<typeof DebateResponseSchema.parse>;
    }
  >,
  provider: ProviderSettings,
  emit: EventEmitter
): Promise<void> {
  emit({ type: "chairman_start" });

  const analyses = Array.from(memberResults.values()).map((r) => ({
    memberName: r.config.name,
    analysis: r.analysis,
    debate: r.debate,
  }));

  try {
    const { parsed } = await callLLM(
      ChairmanReportSchema,
      {
        model: resolveChairmanModel(provider),
        systemPrompt: CHAIRMAN_CONFIG.systemPrompt,
        userPrompt: buildChairmanUserPrompt(idea, analyses),
        onChunk: (chunk) => {
          emit({ type: "chairman_stream", data: chunk });
        },
      },
      provider
    );

    emit({ type: "chairman_complete", data: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    emit({ type: "chairman_error", data: { error: message } });
  }
}
