-- History / proofs. Run after 001_init.sql.

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
