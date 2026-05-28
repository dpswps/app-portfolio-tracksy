-- ─────────────────────────────────────────────────────────────
-- Tracksy v8: 운영자(관리자) 시스템
-- profiles.is_admin + 본인 admin 여부 조회 RPC + 관리자용 조인 view
-- ─────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 본인이 admin 인지 확인 — RLS 정책 안에서 호출 가능하도록.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- 관리자 전용 사용자 조회 view — auth.users 의 email/last_sign_in_at 등 노출.
-- service_role 로만 조회 (RLS 우회). 클라이언트는 server action 통해서만 호출.
create or replace view public.admin_users_view as
select
  p.id,
  p.name,
  p.email,
  p.birth,
  p.style,
  p.avatar_url,
  p.has_onboarded,
  p.is_admin,
  p.created_at,
  p.updated_at,
  u.email as auth_email,
  u.last_sign_in_at,
  u.created_at as auth_created_at,
  u.banned_until
from public.profiles p
left join auth.users u on u.id = p.id;

-- ─────────────────────────────────────────────────────────────
-- RLS: profiles 의 기존 정책에 admin override 추가.
-- admin 은 모든 행 select·update 가능.
-- ─────────────────────────────────────────────────────────────

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles for select
using (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

-- running_records 도 admin 전체 조회 가능 (통계용).
drop policy if exists "rr_select_admin" on public.running_records;
create policy "rr_select_admin" on public.running_records for select
using (public.is_admin());

-- community_posts 는 이미 모두 select 가능. admin 은 delete 추가.
drop policy if exists "cp_delete_admin" on public.community_posts;
create policy "cp_delete_admin" on public.community_posts for delete
using (public.is_admin());

-- post_comments admin delete (악성 댓글 정리용).
drop policy if exists "pc_delete_admin" on public.post_comments;
create policy "pc_delete_admin" on public.post_comments for delete
using (public.is_admin());

-- inquiries · feedback admin 전체 select.
drop policy if exists "inq_select_admin" on public.inquiries;
create policy "inq_select_admin" on public.inquiries for select
using (public.is_admin());
drop policy if exists "inq_update_admin" on public.inquiries;
create policy "inq_update_admin" on public.inquiries for update
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "fb_select_admin" on public.feedback;
create policy "fb_select_admin" on public.feedback for select
using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 첫 관리자 지정 — ujin2019@gmail.com 자동 admin promote.
-- 가입 후 이메일 매칭되는 행이 있으면 is_admin = true.
-- 새로 가입할 때도 같은 이메일이면 자동 admin.
-- ─────────────────────────────────────────────────────────────

update public.profiles
set is_admin = true
where email = 'dpswps12@gmail.com';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (
    new.id,
    new.email,
    -- 부트스트랩: 지정된 이메일은 가입 즉시 admin.
    case when new.email = 'dpswps12@gmail.com' then true else false end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
