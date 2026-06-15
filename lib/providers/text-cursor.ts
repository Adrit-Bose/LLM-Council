import { Agent, CursorAgentError } from "@cursor/sdk";
import { resolveCursorApiKey } from "../cursor-auth";
import { buildCombinedPrompt } from "./shared";
import type { ProviderContext, TextCallOptions } from "./types";

export async function callCursorText(
  options: TextCallOptions,
  context: ProviderContext
): Promise<string> {
  const { model, systemPrompt, userPrompt } = options;
  const apiKey = resolveCursorApiKey();
  const combinedPrompt = buildCombinedPrompt(systemPrompt, userPrompt);

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
      name: "LLM Council Chairman Q&A",
    });

    const run = await agent.send(
      `${combinedPrompt}\n\nIMPORTANT: Do not use tools. Reply in plain text only.`
    );

    let raw = "";
    for await (const event of run.stream()) {
      if (event.type === "assistant") {
        for (const block of event.message.content) {
          if (block.type === "text") raw += block.text;
        }
      }
    }

    const result = await run.wait();
    if (result.status === "error") {
      throw new Error(result.result || "Cursor agent run failed");
    }

    return (raw || result.result || "").trim();
  } catch (err) {
    if (err instanceof CursorAgentError) {
      throw new Error(err.message);
    }
    throw err;
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
