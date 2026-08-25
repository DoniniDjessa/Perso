-- Income (money in) and credits (lent / borrowed). No GPS.

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
