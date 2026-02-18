-- Phase B hardening migration
-- 1) Adds visitor tracking for comments
-- 2) Adds reports table for moderation
-- 3) Removes public write policies so writes go through Edge Function only

alter table public.page_comments
  add column if not exists visitor_id text;

update public.page_comments
set visitor_id = coalesce(nullif(visitor_id, ''), 'legacy')
where visitor_id is null or visitor_id = '';

alter table public.page_comments
  alter column visitor_id set not null;

create table if not exists public.comment_reports (
  id bigint generated always as identity primary key,
  comment_id bigint not null references public.page_comments(id) on delete cascade,
  page_slug text not null,
  visitor_id text not null,
  reason text not null default 'community-flag',
  created_at timestamptz not null default timezone('utc', now()),
  constraint comment_reports_page_slug_len check (char_length(page_slug) between 1 and 300),
  constraint comment_reports_visitor_id_len check (char_length(visitor_id) between 1 and 200),
  constraint comment_reports_reason_len check (char_length(reason) between 1 and 300),
  constraint comment_reports_once_per_visitor unique (comment_id, visitor_id)
);

create index if not exists idx_page_comments_page_slug_created_at
  on public.page_comments (page_slug, created_at desc);

create index if not exists idx_page_comments_visitor_created_at
  on public.page_comments (visitor_id, created_at desc);

create index if not exists idx_comment_reports_page_slug_created_at
  on public.comment_reports (page_slug, created_at desc);

alter table public.comment_reports enable row level security;

-- Keep public read, remove public writes for hardened mode.
drop policy if exists "Public can insert page likes" on public.page_likes;
drop policy if exists "Public can delete page likes" on public.page_likes;
drop policy if exists "Public can insert page comments" on public.page_comments;

-- Explicitly block direct read/write on reports for anonymous/public roles.
drop policy if exists "Public can read comment reports" on public.comment_reports;
drop policy if exists "Public can insert comment reports" on public.comment_reports;

-- Optional: add explicit read policies if missing.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'page_likes'
      and policyname = 'Public can read page likes'
  ) then
    create policy "Public can read page likes"
      on public.page_likes
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'page_comments'
      and policyname = 'Public can read page comments'
  ) then
    create policy "Public can read page comments"
      on public.page_comments
      for select
      using (true);
  end if;
end $$;
