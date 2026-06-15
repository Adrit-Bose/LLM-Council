/**
 * LLM provider configuration types.
 *
 * Users supply their own provider API key in the browser session.
 */

export type ProviderMode = "cursor" | "custom";

export type CustomProviderId = "openai" | "anthropic" | "gemini" | "groq";

export interface ProviderSettings {
  /** custom = user-supplied API key (cursor kept for legacy session data). */
  mode: ProviderMode;
  /** Which external provider when mode is custom */
  customProvider?: CustomProviderId;
  /** User API key — only sent per-request, stored in sessionStorage on client */
  apiKey?: string;
  /** Optional base URL for OpenAI-compatible endpoints */
  baseUrl?: string;
  /** Global model override for custom mode */
  model?: string;
  /** Chairman model override (custom mode) */
  chairmanModel?: string;
}

export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  mode: "custom",
  customProvider: "openai",
};

export const CUSTOM_PROVIDER_LABELS: Record<CustomProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  groq: "Groq",
};

/** Groq OpenAI-compatible endpoint — used automatically when provider is groq */
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export const CUSTOM_PROVIDER_DEFAULT_MODELS: Record<CustomProviderId, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
  gemini: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
};

export const CUSTOM_PROVIDER_CHAIRMAN_MODELS: Record<CustomProviderId, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  gemini: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
};

/** Base URL for OpenAI-compatible providers (OpenAI, Groq, etc.) */
export function resolveOpenAICompatibleBaseUrl(
  settings: ProviderSettings
): string | undefined {
  if (settings.customProvider === "groq") {
    return settings.baseUrl?.trim() || GROQ_BASE_URL;
  }
  return settings.baseUrl?.trim() || undefined;
}

/** Cursor model ids — edit here or via CURSOR_DEFAULT_MODEL / CURSOR_CHAIRMAN_MODEL env */
export const CURSOR_MEMBER_MODEL =
  process.env.CURSOR_DEFAULT_MODEL || "auto";
export const CURSOR_CHAIRMAN_MODEL =
  process.env.CURSOR_CHAIRMAN_MODEL || "auto";
