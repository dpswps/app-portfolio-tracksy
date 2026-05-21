-- ─────────────────────────────────────────────────────────────
-- Tracksy v6: push_subscriptions (Web Push API 구독 정보)
-- VAPID 키 발급 후 클라이언트가 서비스 워커로 구독하면
-- 그 endpoint + keys 를 여기 저장.
-- 알림 발송은 Edge Function 또는 외부 서버에서 web-push 라이브러리로.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "psub_select_own" on public.push_subscriptions;
create policy "psub_select_own" on public.push_subscriptions for select using (auth.uid() = user_id);
drop policy if exists "psub_insert_own" on public.push_subscriptions;
create policy "psub_insert_own" on public.push_subscriptions for insert with check (auth.uid() = user_id);
drop policy if exists "psub_delete_own" on public.push_subscriptions;
create policy "psub_delete_own" on public.push_subscriptions for delete using (auth.uid() = user_id);
