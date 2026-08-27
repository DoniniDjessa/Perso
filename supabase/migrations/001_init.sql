-- Perso V1. Run this whole file in the Supabase SQL editor.
-- Tables use the "perso-" prefix so they never clash with other apps on the same project.
-- Storage bucket: perso-bucket. Deleting a row also deletes its images.

create extension if not exists pgcrypto;

-- Rename leftover unprefixed tables from an earlier run (no-op if already prefixed).
do $$
begin
  if to_regclass('public.expenses') is not null and to_regclass('public."perso-expenses"') is null then
    alter table public.expenses rename to "perso-expenses";
  end if;
  if to_regclass('public.todos') is not null and to_regclass('public."perso-todos"') is null then
    alter table public.todos rename to "perso-todos";
  end if;
  if to_regclass('public.agenda_events') is not null and to_regclass('public."perso-agenda-events"') is null then
    alter table public.agenda_events rename to "perso-agenda-events";
  end if;
end $$;

create table if not exists public."perso-expenses" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null,
  currency text not null default 'XOF',
  label text not null,
  category text,
  image_path text,
  spent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public."perso-todos" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_at timestamptz,
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public."perso-agenda-events" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  place text,
  notes text,
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public."perso-profiles" (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null,
  email text not null,
  avatar_path text,
  created_at timestamptz not null default now(),
  constraint perso_profiles_pseudo_format check (pseudo ~ '^[a-z0-9._]{3,24}$')
);

alter table public."perso-expenses" add column if not exists image_path text;
alter table public."perso-todos" add column if not exists image_path text;
alter table public."perso-agenda-events" add column if not exists image_path text;
alter table public."perso-profiles" add column if not exists avatar_path text;

alter table public."perso-expenses" add column if not exists people jsonb not null default '[]'::jsonb;
alter table public."perso-todos" add column if not exists people jsonb not null default '[]'::jsonb;
alter table public."perso-agenda-events" add column if not exists people jsonb not null default '[]'::jsonb;
alter table public."perso-agenda-events" add column if not exists priority integer not null default 2;
alter table public."perso-expenses" add column if not exists map_lat double precision;
alter table public."perso-expenses" add column if not exists map_lng double precision;
alter table public."perso-expenses" add column if not exists map_label text;
alter table public."perso-agenda-events" add column if not exists map_lat double precision;
alter table public."perso-agenda-events" add column if not exists map_lng double precision;
alter table public."perso-agenda-events" add column if not exists map_label text;
alter table public."perso-profiles" add column if not exists notify_todos boolean not null default true;
alter table public."perso-profiles" add column if not exists notify_agenda boolean not null default true;
alter table public."perso-profiles" add column if not exists notify_todo_minutes integer not null default 60;
alter table public."perso-profiles" add column if not exists notify_agenda_minutes integer not null default 30;
alter table public."perso-profiles" add column if not exists push_token text;
alter table public."perso-expenses" add column if not exists hidden boolean not null default false;
alter table public."perso-profiles" add column if not exists hide_code_hash text;
alter table public."perso-todos" add column if not exists reminder jsonb;
alter table public."perso-todos" add column if not exists kind text not null default 'once';
alter table public."perso-todos" add column if not exists habit jsonb;
alter table public."perso-agenda-events" add column if not exists reminder jsonb;

create unique index if not exists perso_profiles_pseudo_lower
  on public."perso-profiles" (lower(pseudo));

alter table public."perso-expenses" enable row level security;
alter table public."perso-todos" enable row level security;
alter table public."perso-agenda-events" enable row level security;
alter table public."perso-profiles" enable row level security;

drop policy if exists "expenses_owner" on public."perso-expenses";
drop policy if exists "perso_expenses_owner" on public."perso-expenses";
create policy "perso_expenses_owner" on public."perso-expenses"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "todos_owner" on public."perso-todos";
drop policy if exists "perso_todos_owner" on public."perso-todos";
create policy "perso_todos_owner" on public."perso-todos"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "agenda_owner" on public."perso-agenda-events";
drop policy if exists "perso_agenda_owner" on public."perso-agenda-events";
create policy "perso_agenda_owner" on public."perso-agenda-events"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "perso_profiles_select_own" on public."perso-profiles";
create policy "perso_profiles_select_own" on public."perso-profiles"
  for select using (auth.uid() = id);

drop policy if exists "perso_profiles_update_own" on public."perso-profiles";
create policy "perso_profiles_update_own" on public."perso-profiles"
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop index if exists expenses_user_spent_at;
drop index if exists todos_user_created_at;
drop index if exists agenda_user_starts_at;
create index if not exists perso_expenses_user_spent_at on public."perso-expenses" (user_id, spent_at desc);
create index if not exists perso_todos_user_created_at on public."perso-todos" (user_id, created_at desc);
create index if not exists perso_agenda_user_starts_at on public."perso-agenda-events" (user_id, starts_at);

-- Auth signup writes perso-profiles only (does not touch other apps' profiles tables).
create or replace function public.perso_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  handle text;
begin
  handle := lower(trim(coalesce(new.raw_user_meta_data->>'pseudo', '')));
  if handle = '' then
    raise exception 'pseudo requis';
  end if;

  insert into public."perso-profiles" (id, pseudo, email)
  values (new.id, handle, new.email);
  return new;
end;
$$;

drop trigger if exists perso_on_auth_user_created on auth.users;
create trigger perso_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.perso_handle_new_user();

create or replace function public.perso_email_for_pseudo(p_pseudo text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email
  from public."perso-profiles"
  where lower(pseudo) = lower(trim(p_pseudo))
  limit 1;
$$;

create or replace function public.perso_pseudo_taken(p_pseudo text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public."perso-profiles"
    where lower(pseudo) = lower(trim(p_pseudo))
  );
$$;

revoke all on function public.perso_email_for_pseudo(text) from public;
revoke all on function public.perso_pseudo_taken(text) from public;
grant execute on function public.perso_email_for_pseudo(text) to anon, authenticated;
grant execute on function public.perso_pseudo_taken(text) to anon, authenticated;

insert into public."perso-profiles" (id, pseudo, email)
select
  u.id,
  left(
    regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9._]', '', 'g')
      || '_' || substr(replace(u.id::text, '-', ''), 1, 6),
    24
  ),
  u.email
from auth.users u
where not exists (select 1 from public."perso-profiles" p where p.id = u.id);

-- Images live in perso-bucket under {user_id}/{parent_id}/...
insert into storage.buckets (id, name, public)
values ('perso-bucket', 'perso-bucket', false)
on conflict (id) do nothing;

drop policy if exists "perso_storage_select" on storage.objects;
create policy "perso_storage_select" on storage.objects
  for select using (
    bucket_id = 'perso-bucket'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "perso_storage_insert" on storage.objects;
create policy "perso_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'perso-bucket'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "perso_storage_update" on storage.objects;
create policy "perso_storage_update" on storage.objects
  for update using (
    bucket_id = 'perso-bucket'
    and split_part(name, '/', 1) = auth.uid()::text
  ) with check (
    bucket_id = 'perso-bucket'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "perso_storage_delete" on storage.objects;
create policy "perso_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'perso-bucket'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Remove files when the parent row is deleted.
create or replace function public.perso_delete_parent_images()
returns trigger
language plpgsql
security definer
set search_path = storage, public
as $$
declare
  pointer text;
begin
  pointer := coalesce(
    to_jsonb(old)->>'image_path',
    to_jsonb(old)->>'avatar_path'
  );

  delete from storage.objects
  where bucket_id = 'perso-bucket'
    and (
      (pointer is not null and name = pointer)
      or name like old.id::text || '/%'
      or name like '%/' || old.id::text || '/%'
    );

  return old;
end;
$$;

drop trigger if exists perso_expenses_delete_images on public."perso-expenses";
create trigger perso_expenses_delete_images
  before delete on public."perso-expenses"
  for each row execute procedure public.perso_delete_parent_images();

drop trigger if exists perso_todos_delete_images on public."perso-todos";
create trigger perso_todos_delete_images
  before delete on public."perso-todos"
  for each row execute procedure public.perso_delete_parent_images();

drop trigger if exists perso_agenda_delete_images on public."perso-agenda-events";
create trigger perso_agenda_delete_images
  before delete on public."perso-agenda-events"
  for each row execute procedure public.perso_delete_parent_images();

drop trigger if exists perso_profiles_delete_images on public."perso-profiles";
create trigger perso_profiles_delete_images
  before delete on public."perso-profiles"
  for each row execute procedure public.perso_delete_parent_images();

create table if not exists public."perso-history" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  notes text,
  image_path text,
  proof_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public."perso-history" enable row level security;

drop policy if exists "perso_history_owner" on public."perso-history";
create policy "perso_history_owner" on public."perso-history"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists perso_history_user_proof_at
  on public."perso-history" (user_id, proof_at desc);

drop trigger if exists perso_history_delete_images on public."perso-history";
create trigger perso_history_delete_images
  before delete on public."perso-history"
  for each row execute procedure public.perso_delete_parent_images();

alter table public."perso-history" add column if not exists map_lat double precision;
alter table public."perso-history" add column if not exists map_lng double precision;
alter table public."perso-history" add column if not exists map_label text;
alter table public."perso-history" add column if not exists people jsonb not null default '[]'::jsonb;
alter table public."perso-history" add column if not exists audio_path text;
alter table public."perso-history" add column if not exists video_path text;
alter table public."perso-history" add column if not exists links jsonb not null default '[]'::jsonb;

create table if not exists public."perso-incomes" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null,
  currency text not null default 'XOF',
  label text not null,
  category text,
  notes text,
  image_path text,
  people jsonb not null default '[]'::jsonb,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public."perso-credits" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null,
  currency text not null default 'XOF',
  label text not null,
  direction text not null default 'lent',
  notes text,
  image_path text,
  people jsonb not null default '[]'::jsonb,
  repaid boolean not null default false,
  opened_at timestamptz not null default now(),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  constraint perso_credits_direction_check check (direction in ('lent', 'borrowed'))
);

alter table public."perso-incomes" enable row level security;
alter table public."perso-credits" enable row level security;

drop policy if exists "perso_incomes_owner" on public."perso-incomes";
create policy "perso_incomes_owner" on public."perso-incomes"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "perso_credits_owner" on public."perso-credits";
create policy "perso_credits_owner" on public."perso-credits"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists perso_incomes_user_received_at
  on public."perso-incomes" (user_id, received_at desc);

create index if not exists perso_credits_user_opened_at
  on public."perso-credits" (user_id, opened_at desc);

drop trigger if exists perso_incomes_delete_images on public."perso-incomes";
create trigger perso_incomes_delete_images
  before delete on public."perso-incomes"
  for each row execute procedure public.perso_delete_parent_images();

drop trigger if exists perso_credits_delete_images on public."perso-credits";
create trigger perso_credits_delete_images
  before delete on public."perso-credits"
  for each row execute procedure public.perso_delete_parent_images();

alter table public."perso-credits" add column if not exists reminder jsonb;

