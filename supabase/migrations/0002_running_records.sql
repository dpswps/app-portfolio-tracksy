-- ─────────────────────────────────────────────────────────────
-- Tracksy v2: running_records · running_splits
-- ─────────────────────────────────────────────────────────────

create table if not exists public.running_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  dist text,
  pace text,
  bpm integer,
  time text,
  note text,
  elev text,
  cadence integer,
  kcal integer,
  screenshot_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists running_records_user_date_idx
  on public.running_records (user_id, date desc);

drop trigger if exists running_records_set_updated_at on public.running_records;
create trigger running_records_set_updated_at
before update on public.running_records
for each row execute function public.set_updated_at();

alter table public.running_records enable row level security;

drop policy if exists "rr_select_own" on public.running_records;
create policy "rr_select_own" on public.running_records
for select using (auth.uid() = user_id);

drop policy if exists "rr_insert_own" on public.running_records;
create policy "rr_insert_own" on public.running_records
for insert with check (auth.uid() = user_id);

drop policy if exists "rr_update_own" on public.running_records;
create policy "rr_update_own" on public.running_records
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "rr_delete_own" on public.running_records;
create policy "rr_delete_own" on public.running_records
for delete using (auth.uid() = user_id);

-- splits 정규화
create table if not exists public.running_splits (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.running_records(id) on delete cascade,
  idx integer not null,
  km numeric,
  time text,
  pace text,
  bpm integer
);

create index if not exists running_splits_record_idx
  on public.running_splits (record_id, idx);

alter table public.running_splits enable row level security;

drop policy if exists "splits_select_own" on public.running_splits;
create policy "splits_select_own" on public.running_splits
for select using (
  exists (select 1 from public.running_records r
          where r.id = record_id and r.user_id = auth.uid())
);

drop policy if exists "splits_write_own" on public.running_splits;
create policy "splits_write_own" on public.running_splits
for all using (
  exists (select 1 from public.running_records r
          where r.id = record_id and r.user_id = auth.uid())
) with check (
  exists (select 1 from public.running_records r
          where r.id = record_id and r.user_id = auth.uid())
);
