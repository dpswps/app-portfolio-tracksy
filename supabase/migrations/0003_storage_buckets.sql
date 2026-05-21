-- ─────────────────────────────────────────────────────────────
-- Tracksy v3: Storage 버킷
-- 모두 public read (URL만 알면 누구나 조회 — 공유 URL 패턴),
-- write 는 본인 폴더만 (path 가 auth.uid()/... 패턴이어야 함).
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('screenshots', 'screenshots', true),
  ('post-images', 'post-images', true),
  ('gallery-cards', 'gallery-cards', true)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Storage RLS policies
-- 경로 규칙: <bucket>/<auth.uid()>/<filename>
-- 본인 폴더만 쓰기/수정/삭제, 읽기는 public.
-- ─────────────────────────────────────────────────────────────

-- 기존 storage RLS 는 default 로 비활성 — 켜기.
-- (storage.objects 는 이미 enable rls 로 시작하지만 안전 차원으로 한번 더.)
alter table storage.objects enable row level security;

-- public read
drop policy if exists "tracksy_buckets_public_read" on storage.objects;
create policy "tracksy_buckets_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('avatars', 'covers', 'screenshots', 'post-images', 'gallery-cards'));

-- insert: 본인 폴더만
drop policy if exists "tracksy_buckets_insert_own" on storage.objects;
create policy "tracksy_buckets_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars', 'covers', 'screenshots', 'post-images', 'gallery-cards')
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- update: 본인 폴더만
drop policy if exists "tracksy_buckets_update_own" on storage.objects;
create policy "tracksy_buckets_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars', 'covers', 'screenshots', 'post-images', 'gallery-cards')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('avatars', 'covers', 'screenshots', 'post-images', 'gallery-cards')
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- delete: 본인 폴더만
drop policy if exists "tracksy_buckets_delete_own" on storage.objects;
create policy "tracksy_buckets_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars', 'covers', 'screenshots', 'post-images', 'gallery-cards')
  and (storage.foldername(name))[1] = auth.uid()::text
);
