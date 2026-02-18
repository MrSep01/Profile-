-- Phase C analytics + comment metadata migration
-- 1) Extend comments with author metadata + moderation status
-- 2) Add share_events analytics table
-- 3) Keep writes secured through Edge Function (no public policies)

alter table public.page_comments
  add column if not exists author_name text;

update public.page_comments
set author_name = 'Guest'
where author_name is null or btrim(author_name) = '';

alter table public.page_comments
  alter column author_name set default 'Guest',
  alter column author_name set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'page_comments_author_name_len'
  ) then
    alter table public.page_comments
      add constraint page_comments_author_name_len
      check (char_length(author_name) between 1 and 80);
  end if;
end $$;

alter table public.page_comments
  add column if not exists status text not null default 'published',
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.page_comments
set status = 'published'
where status is null or btrim(status) = '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'page_comments_status_allowed'
  ) then
    alter table public.page_comments
      add constraint page_comments_status_allowed
      check (status in ('published', 'pending', 'hidden'));
  end if;
end $$;

create or replace function public.set_page_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_page_comments_updated_at on public.page_comments;
create trigger trg_page_comments_updated_at
before update on public.page_comments
for each row execute function public.set_page_comments_updated_at();

create table if not exists public.share_events (
  id bigint generated always as identity primary key,
  page_slug text not null,
  channel text not null,
  placement text not null default 'top',
  visitor_id text not null,
  user_agent text,
  referrer text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint share_events_page_slug_len check (char_length(page_slug) between 1 and 300),
  constraint share_events_channel_len check (char_length(channel) between 1 and 40),
  constraint share_events_placement_len check (char_length(placement) between 1 and 40),
  constraint share_events_visitor_id_len check (char_length(visitor_id) between 1 and 200)
);

create index if not exists idx_share_events_page_slug_created_at
  on public.share_events (page_slug, created_at desc);

create index if not exists idx_share_events_channel_created_at
  on public.share_events (channel, created_at desc);

alter table public.share_events enable row level security;

drop policy if exists "Public can read share events" on public.share_events;
drop policy if exists "Public can insert share events" on public.share_events;
