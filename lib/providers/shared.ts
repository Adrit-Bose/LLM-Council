/** Extract JSON from model output, tolerating markdown fences */
export function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildCombinedPrompt(systemPrompt: string, userPrompt: string): string {
  return `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\n---\n\nUSER REQUEST:\n${userPrompt}`;
}
