-- ─────────────────────────────────────────────────────────────
-- Tracksy v7: 사용자 피드백·문의 (백엔드)
-- /feedback 폼이 여기에 INSERT.
-- 관리자는 별도 view 또는 service role 키로 확인.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  category text check (category in ('bug','feature','etc')) default 'etc',
  body text not null,
  user_agent text,
  app_version text,
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;
-- 누구나 (anon 포함) INSERT 가능 — 로그인 안한 게스트 피드백도 받음.
drop policy if exists "fb_insert_anyone" on public.feedback;
create policy "fb_insert_anyone" on public.feedback for insert with check (true);
-- 자신의 행은 select 가능 (로그인 한 경우)
drop policy if exists "fb_select_own" on public.feedback;
create policy "fb_select_own" on public.feedback for select using (auth.uid() = user_id);

-- 문의 (inquiries) — /inquiry 폼.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text check (type in ('서비스 이용','계정/로그인','기타')) default '기타',
  title text not null,
  body text not null,
  reply text,
  status text not null default 'wait' check (status in ('wait','done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inquiries_user_idx on public.inquiries (user_id, created_at desc);

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

alter table public.inquiries enable row level security;
drop policy if exists "inq_select_own" on public.inquiries;
create policy "inq_select_own" on public.inquiries for select using (auth.uid() = user_id);
drop policy if exists "inq_insert_own" on public.inquiries;
create policy "inq_insert_own" on public.inquiries for insert with check (auth.uid() = user_id);
