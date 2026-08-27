-- Recurring habit TODOs. Run in the Supabase SQL editor.

alter table public."perso-todos"
  add column if not exists kind text not null default 'once';

alter table public."perso-todos"
  add column if not exists habit jsonb;

alter table public."perso-todos"
  drop constraint if exists perso_todos_kind_check;

alter table public."perso-todos"
  add constraint perso_todos_kind_check check (kind in ('once', 'habit'));

notify pgrst, 'reload schema';
