-- Per-item reminder config (JSON): enabled, mode, sound, start_at, interval, count.

alter table public."perso-todos"
  add column if not exists reminder jsonb;

alter table public."perso-agenda-events"
  add column if not exists reminder jsonb;

alter table public."perso-credits"
  add column if not exists reminder jsonb;
