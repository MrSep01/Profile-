-- Run this in Supabase SQL Editor.
-- Creates public tables for page likes and comments used by the portfolio website.

create table if not exists public.page_likes (
  id bigint generated always as identity primary key,
  page_slug text not null,
  visitor_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint page_likes_page_slug_len check (char_length(page_slug) between 1 and 300),
  constraint page_likes_visitor_id_len check (char_length(visitor_id) between 1 and 200),
  constraint page_likes_unique unique (page_slug, visitor_id)
);

create index if not exists idx_page_likes_page_slug on public.page_likes (page_slug);

create table if not exists public.page_comments (
  id bigint generated always as identity primary key,
  page_slug text not null,
  comment_text text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint page_comments_page_slug_len check (char_length(page_slug) between 1 and 300),
  constraint page_comments_text_len check (char_length(comment_text) between 1 and 1200)
);

create index if not exists idx_page_comments_page_slug_created_at
  on public.page_comments (page_slug, created_at);

alter table public.page_likes enable row level security;
alter table public.page_comments enable row level security;

-- Public read access
drop policy if exists "Public can read page likes" on public.page_likes;
create policy "Public can read page likes"
on public.page_likes
for select
using (true);

drop policy if exists "Public can read page comments" on public.page_comments;
create policy "Public can read page comments"
on public.page_comments
for select
using (true);

-- Public write access for anonymous visitors
drop policy if exists "Public can insert page likes" on public.page_likes;
create policy "Public can insert page likes"
on public.page_likes
for insert
with check (true);

drop policy if exists "Public can delete page likes" on public.page_likes;
create policy "Public can delete page likes"
on public.page_likes
for delete
using (true);

drop policy if exists "Public can insert page comments" on public.page_comments;
create policy "Public can insert page comments"
on public.page_comments
for insert
with check (true);
