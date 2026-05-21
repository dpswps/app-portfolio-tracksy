-- ─────────────────────────────────────────────────────────────
-- Tracksy v4: gallery_cards · saved_styles · ai_journals
-- ─────────────────────────────────────────────────────────────

create table if not exists public.gallery_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  month int not null,
  date_label text not null,
  title text,
  dist text,
  pace text,
  time text,
  kcal int,
  elev text,
  bpm int,
  cadence int,
  likes int not null default 0,
  comments int not null default 0,
  bg text not null,
  snapshot jsonb,
  created_at timestamptz not null default now()
);
create index if not exists gallery_cards_user_ym_idx on public.gallery_cards (user_id, year desc, month desc);

alter table public.gallery_cards enable row level security;
drop policy if exists "gc_select_own" on public.gallery_cards;
create policy "gc_select_own" on public.gallery_cards for select using (auth.uid() = user_id);
drop policy if exists "gc_insert_own" on public.gallery_cards;
create policy "gc_insert_own" on public.gallery_cards for insert with check (auth.uid() = user_id);
drop policy if exists "gc_update_own" on public.gallery_cards;
create policy "gc_update_own" on public.gallery_cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "gc_delete_own" on public.gallery_cards;
create policy "gc_delete_own" on public.gallery_cards for delete using (auth.uid() = user_id);

-- saved_styles — kind: "saved"(시드에서 저장한 거) / "mine"(직접 만든 거)
create table if not exists public.saved_styles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('saved', 'mine')),
  source_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists saved_styles_user_kind_idx on public.saved_styles (user_id, kind);

alter table public.saved_styles enable row level security;
drop policy if exists "ss_select_own" on public.saved_styles;
create policy "ss_select_own" on public.saved_styles for select using (auth.uid() = user_id);
drop policy if exists "ss_insert_own" on public.saved_styles;
create policy "ss_insert_own" on public.saved_styles for insert with check (auth.uid() = user_id);
drop policy if exists "ss_update_own" on public.saved_styles;
create policy "ss_update_own" on public.saved_styles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "ss_delete_own" on public.saved_styles;
create policy "ss_delete_own" on public.saved_styles for delete using (auth.uid() = user_id);

-- ai_journals — AI 러닝일지 저장본
create table if not exists public.ai_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  saved_at timestamptz not null default now(),
  summary text not null
);
create index if not exists ai_journals_user_date_idx on public.ai_journals (user_id, date desc);

alter table public.ai_journals enable row level security;
drop policy if exists "aj_select_own" on public.ai_journals;
create policy "aj_select_own" on public.ai_journals for select using (auth.uid() = user_id);
drop policy if exists "aj_insert_own" on public.ai_journals;
create policy "aj_insert_own" on public.ai_journals for insert with check (auth.uid() = user_id);
drop policy if exists "aj_update_own" on public.ai_journals;
create policy "aj_update_own" on public.ai_journals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "aj_delete_own" on public.ai_journals;
create policy "aj_delete_own" on public.ai_journals for delete using (auth.uid() = user_id);
