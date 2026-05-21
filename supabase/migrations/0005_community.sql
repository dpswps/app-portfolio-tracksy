-- ─────────────────────────────────────────────────────────────
-- Tracksy v5: 커뮤니티
-- community_posts · post_comments · post_likes · post_saves
-- ─────────────────────────────────────────────────────────────

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('photo','stats')),
  dist text, time text, pace text, cal text, extra text,
  brand text,
  bg text not null,
  image_url text,
  tall boolean not null default false,
  avatar_bg text,
  caption text,
  tags text,
  likes int not null default 0,
  comments int not null default 0,
  date text,
  created_at timestamptz not null default now()
);
create index if not exists community_posts_created_idx on public.community_posts (created_at desc);
create index if not exists community_posts_author_idx on public.community_posts (author_id);

alter table public.community_posts enable row level security;

-- 모든 사용자가 read 가능 (피드)
drop policy if exists "cp_select_all" on public.community_posts;
create policy "cp_select_all" on public.community_posts for select using (true);

-- write 는 본인만
drop policy if exists "cp_insert_own" on public.community_posts;
create policy "cp_insert_own" on public.community_posts for insert with check (auth.uid() = author_id);
drop policy if exists "cp_update_own" on public.community_posts;
create policy "cp_update_own" on public.community_posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "cp_delete_own" on public.community_posts;
create policy "cp_delete_own" on public.community_posts for delete using (auth.uid() = author_id);

-- comments
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at asc);

alter table public.post_comments enable row level security;
drop policy if exists "pc_select_all" on public.post_comments;
create policy "pc_select_all" on public.post_comments for select using (true);
drop policy if exists "pc_insert_own" on public.post_comments;
create policy "pc_insert_own" on public.post_comments for insert with check (auth.uid() = author_id);
drop policy if exists "pc_delete_own" on public.post_comments;
create policy "pc_delete_own" on public.post_comments for delete using (auth.uid() = author_id);

-- likes (unique user_id+post_id)
create table if not exists public.post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;
drop policy if exists "pl_select_all" on public.post_likes;
create policy "pl_select_all" on public.post_likes for select using (true);
drop policy if exists "pl_insert_own" on public.post_likes;
create policy "pl_insert_own" on public.post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "pl_delete_own" on public.post_likes;
create policy "pl_delete_own" on public.post_likes for delete using (auth.uid() = user_id);

-- 좋아요/취소 시 community_posts.likes 카운트 자동 갱신
create or replace function public.bump_post_likes()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set likes = likes + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set likes = greatest(0, likes - 1) where id = old.post_id;
  end if;
  return null;
end; $$;
drop trigger if exists post_likes_count on public.post_likes;
create trigger post_likes_count after insert or delete on public.post_likes
for each row execute function public.bump_post_likes();

-- 댓글 추가/삭제 시 community_posts.comments 카운트 자동 갱신
create or replace function public.bump_post_comments()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set comments = comments + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set comments = greatest(0, comments - 1) where id = old.post_id;
  end if;
  return null;
end; $$;
drop trigger if exists post_comments_count on public.post_comments;
create trigger post_comments_count after insert or delete on public.post_comments
for each row execute function public.bump_post_comments();

-- saves (북마크) — 본인만 select, write
create table if not exists public.post_saves (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_saves enable row level security;
drop policy if exists "ps_select_own" on public.post_saves;
create policy "ps_select_own" on public.post_saves for select using (auth.uid() = user_id);
drop policy if exists "ps_insert_own" on public.post_saves;
create policy "ps_insert_own" on public.post_saves for insert with check (auth.uid() = user_id);
drop policy if exists "ps_delete_own" on public.post_saves;
create policy "ps_delete_own" on public.post_saves for delete using (auth.uid() = user_id);
