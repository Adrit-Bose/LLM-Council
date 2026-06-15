# LLM Council

Evaluate business ideas through six distinct AI perspectives, then receive a synthesized verdict from the Chairman.

## LLM Provider Strategy

- Run `npm run dev` from Cursor's integrated terminal
- Optionally add `CURSOR_API_KEY` to `.env.local` once (from [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations)) — this is server-side only, never committed
- Each council session bills against your **Cursor subscription / API usage**

The UI shows **"Cursor (default)"** when this mode is active.

### Custom: Your own provider (optional)

Open **LLM settings** to switch to a custom provider:

| Provider | API key source |
|----------|----------------|
| OpenAI | User enters key in UI (session only) |
| Anthropic | User enters key in UI (session only) |
| Google Gemini | User enters key in UI (session only) |

Custom keys are stored in **sessionStorage** only — never hardcoded, never committed. If a custom key fails, use **"Revert to Cursor default"** without losing your idea text.

## How It Works

1. **Submit an idea** — describe any business concept, product, or venture.
2. **Council analysis** — six members analyze in parallel:
   - **The Skeptic** — feasibility, assumptions, failure modes
   - **The Market Analyst** — market fit, competition, timing
   - **The Technologist** — technical viability, cost, scalability
   - **The Visionary** — long-term potential, adjacent opportunities
   - **The Devil's Advocate** — strongest case for failure
   - **The Pragmatist** — ROI, resources, execution path
3. **Debate** (optional) — members rebut each other's key points.
4. **Chairman's Report** — final synthesis with scores, verdict (Go / No-Go / Pivot), and reasoning.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Optional: add CURSOR_API_KEY to .env.local for Cursor default mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables (server-side)

| Variable | Required | Description |
|----------|----------|-------------|
| `CURSOR_API_KEY` | No* | Cursor API key for default mode (*recommended for reliable auth) |
| `CURSOR_DEFAULT_MODEL` | No | Model for council members (default: `auto`) |
| `CURSOR_CHAIRMAN_MODEL` | No | Model for Chairman (default: `auto`) |
| `DEFAULT_MODEL` | No | Fallback for custom OpenAI-compatible mode |
| `CHAIRMAN_MODEL` | No | Chairman model override for custom mode |

Custom provider API keys are **not** set via env — users enter them in the UI.

## Customizing Council Members

Edit `lib/council-members.ts`:

- **`systemPrompt`** — rewrite the persona and analytical lens
- Add new members by appending to `COUNCIL_MEMBERS`

Edit model defaults in `lib/provider-config.ts`.

## Swapping LLM Providers (code)

| File | Purpose |
|------|---------|
| `lib/providers/cursor.ts` | Cursor SDK (default) |
| `lib/providers/openai.ts` | OpenAI / compatible APIs |
| `lib/providers/anthropic.ts` | Anthropic Claude |
| `lib/providers/gemini.ts` | Google Gemini |
| `lib/provider-config.ts` | Model defaults and labels |

## Architecture

```
app/page.tsx                    # UI + provider settings (sessionStorage)
app/api/council/route.ts        # SSE endpoint, receives provider per request
app/api/provider/status/route.ts
components/ProviderSettings.tsx # Cursor default vs Custom toggle
lib/council-runner.ts           # Parallel → debate → chairman
lib/providers/                  # Provider implementations
lib/council-members.ts          # Personas and prompts
```

## Production Build

```bash
npm run build
npm start
```
