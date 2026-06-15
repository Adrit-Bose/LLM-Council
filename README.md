# LLM Council

Evaluate business ideas through six distinct AI perspectives, then receive a synthesized verdict from the Chairman.

## LLM Provider Strategy

Council runs use **your own API key**, entered in **LLM settings** on the home page. Keys are stored in **sessionStorage** only — never hardcoded, never committed, never sent to disk.

Supported providers:

| Provider | API key source |
|----------|----------------|
| OpenAI | User enters key in UI (session only) |
| Anthropic | User enters key in UI (session only) |
| Google Gemini | User enters key in UI (session only) |
| Groq | User enters key in UI (session only) |

You can also override member and chairman models per provider in LLM settings. An API key is required before you can convene the council.

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
```

Add your Supabase URL and anon key to `.env.local`, then run the SQL in `supabase/schema.sql` in the Supabase SQL editor.

Enable **Email** auth and (optionally) **Google** OAuth in Supabase Dashboard → Authentication → Providers. For Google, add redirect URL `http://localhost:3000/auth/callback`.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, open **LLM settings**, choose a provider, and enter your API key.

## Authentication & History

- **Sign in** with email/password or Google OAuth (`/login`).
- The council tool is gated behind login; sessions persist across refresh via Supabase Auth.
- Completed council runs are saved to Postgres (`council_runs`) and listed under **History**.
- **Account** shows your email and sign-out; API keys are never stored in the database.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `DEFAULT_MODEL` | No | Fallback member model for custom providers |
| `CHAIRMAN_MODEL` | No | Chairman model override for custom providers |

Provider API keys are **not** set via env — users enter them in the UI (session only).

## Customizing Council Members

Edit `lib/council-members.ts`:

- **`systemPrompt`** — rewrite the persona and analytical lens
- Add new members by appending to `COUNCIL_MEMBERS`

Edit model defaults in `lib/provider-config.ts`.

## Swapping LLM Providers (code)

| File | Purpose |
|------|---------|
| `lib/providers/openai.ts` | OpenAI, Groq, and other compatible APIs |
| `lib/providers/anthropic.ts` | Anthropic Claude |
| `lib/providers/gemini.ts` | Google Gemini |
| `lib/provider-config.ts` | Model defaults and labels |

## Architecture

```
app/page.tsx                    # Council UI (auth required)
app/login/page.tsx              # Sign in / sign up
app/account/page.tsx            # Account panel
app/history/                    # Saved runs list + detail
app/auth/callback/route.ts      # OAuth callback
middleware.ts                   # Session refresh + auth gate
lib/supabase/                   # Supabase browser/server clients
lib/history.ts                  # Save/load/delete council runs
supabase/schema.sql             # Postgres table + RLS policies
app/api/council/route.ts        # SSE endpoint
components/ProviderSettings.tsx # Provider + API key (session only)
lib/council-runner.ts           # Parallel → debate → chairman
```

## Production Build

```bash
npm run build
npm start
```
