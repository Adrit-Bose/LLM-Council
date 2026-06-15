import { Agent, CursorAgentError } from "@cursor/sdk";
import { z } from "zod";
import { resolveCursorApiKey } from "../cursor-auth";
import type { LLMCallOptions, LLMCallResult, ProviderContext } from "./types";
import { buildCombinedPrompt, extractJSON, sleep } from "./shared";

/**
 * Cursor default provider — uses @cursor/sdk local agent.
 * Bills against the user's Cursor subscription / API key on the server.
 *
 * Swap models in lib/provider-config.ts (CURSOR_MEMBER_MODEL / CURSOR_CHAIRMAN_MODEL).
 */
export async function callCursorLLM<T extends z.ZodType>(
  schema: T,
  options: LLMCallOptions,
  _context: ProviderContext
): Promise<LLMCallResult<z.infer<T>>> {
  const { model, systemPrompt, userPrompt, onChunk, maxRetries = 3 } = options;
  const apiKey = resolveCursorApiKey();
  const combinedPrompt = buildCombinedPrompt(systemPrompt, userPrompt);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let agent: Awaited<ReturnType<typeof Agent.create>> | null = null;

    try {
      agent = await Agent.create({
        ...(apiKey ? { apiKey } : {}),
        model: { id: model },
        local: {
          cwd: process.cwd(),
          settingSources: ["user", "project", "team"],
        },
        mode: "plan",
        name: "LLM Council Member",
      });

      const run = await agent.send(
        `${combinedPrompt}\n\nIMPORTANT: Do not use tools. Reply with JSON only.`
      );

      let raw = "";
      for await (const event of run.stream()) {
        if (event.type === "assistant") {
          for (const block of event.message.content) {
            if (block.type === "text") {
              raw += block.text;
              onChunk?.(block.text);
            }
          }
        }
      }

      const result = await run.wait();
      if (result.status === "error") {
        throw new Error(result.result || "Cursor agent run failed");
      }

      if (!raw && result.result) {
        raw = result.result;
        onChunk?.(raw);
      }

      const jsonStr = extractJSON(raw);
      const parsed = schema.parse(JSON.parse(jsonStr));
      return { raw, parsed };
    } catch (err) {
      if (err instanceof CursorAgentError) {
        lastError = new Error(
          err.message.includes("API Key") || err.message.includes("api key")
            ? "Cursor authentication failed. Add CURSOR_API_KEY to .env.local (Dashboard → Integrations) or switch to Custom provider."
            : err.message
        );
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
      if (attempt < maxRetries) await sleep(1000 * attempt);
    } finally {
      if (agent) {
        try {
          await agent[Symbol.asyncDispose]();
        } catch {
          agent.close();
        }
      }
    }
  }

  throw lastError ?? new Error("Cursor LLM call failed after retries");
}
