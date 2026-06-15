import Anthropic from "@anthropic-ai/sdk";
import type { ProviderContext, TextCallOptions } from "./types";

export async function callAnthropicText(
  options: TextCallOptions,
  context: ProviderContext
): Promise<string> {
  const { model, systemPrompt, userPrompt } = options;
  const apiKey = context.settings.apiKey?.trim();

  if (!apiKey) {
    throw new Error("Anthropic API key is required in Custom mode.");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text.trim() : "";
}
