/**
 * Resolves Cursor credentials for default-mode council runs.
 *
 * Default mode never asks the user for a key in the UI. Auth is resolved server-side:
 *   1. CURSOR_API_KEY in .env.local (one-time setup from Cursor Dashboard → Integrations)
 *   2. When running inside Cursor (CURSOR_AGENT=1), the SDK local bridge may use ambient settings
 *
 * See README for one-time .env.local setup — this is not the same as entering a key per session.
 */

export function resolveCursorApiKey(): string | undefined {
  const key = process.env.CURSOR_API_KEY?.trim();
  return key || undefined;
}

export function isRunningInsideCursor(): boolean {
  return process.env.CURSOR_AGENT === "1" || process.env.CURSOR_EXTENSION_HOST_ROLE != null;
}

export interface CursorAvailability {
  available: boolean;
  insideCursor: boolean;
  hasServerKey: boolean;
  message: string;
}

export function checkCursorAvailability(): CursorAvailability {
  const hasServerKey = Boolean(resolveCursorApiKey());
  const insideCursor = isRunningInsideCursor();

  if (hasServerKey) {
    return {
      available: true,
      insideCursor,
      hasServerKey: true,
      message: "Cursor default ready — uses your Cursor API key from server environment.",
    };
  }

  if (insideCursor) {
    return {
      available: true,
      insideCursor: true,
      hasServerKey: false,
      message:
        "Running inside Cursor. Add CURSOR_API_KEY to .env.local once (Dashboard → Integrations), or switch to Custom provider.",
    };
  }

  return {
    available: false,
    insideCursor: false,
    hasServerKey: false,
    message:
      "Cursor default unavailable. Run from Cursor's terminal with CURSOR_API_KEY in .env.local, or use Custom provider.",
  };
}
