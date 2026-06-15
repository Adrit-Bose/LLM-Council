-- LLM Council: council_runs table + Row-Level Security
-- Paste into the Supabase SQL editor and run once.

create table if not exists public.council_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  idea_text text not null,
  report jsonb not null,
  members jsonb not null,
  verdict text not null,
  market_fit int not null check (market_fit >= 0 and market_fit <= 100)
);

create index if not exists council_runs_user_id_created_at_idx
  on public.council_runs (user_id, created_at desc);

alter table public.council_runs enable row level security;

-- Users can read their own runs
create policy "Users can select own council runs"
  on public.council_runs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert runs for themselves only
create policy "Users can insert own council runs"
  on public.council_runs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can delete their own runs
create policy "Users can delete own council runs"
  on public.council_runs
  for delete
  to authenticated
  using (auth.uid() = user_id);
