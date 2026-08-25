-- People on items + notification preferences. Run after 001_init.sql.

alter table public."perso-expenses" add column if not exists people jsonb not null default '[]'::jsonb;
alter table public."perso-todos" add column if not exists people jsonb not null default '[]'::jsonb;
alter table public."perso-agenda-events" add column if not exists people jsonb not null default '[]'::jsonb;

alter table public."perso-profiles" add column if not exists notify_todos boolean not null default true;
alter table public."perso-profiles" add column if not exists notify_agenda boolean not null default true;
alter table public."perso-profiles" add column if not exists notify_todo_minutes integer not null default 60;
alter table public."perso-profiles" add column if not exists notify_agenda_minutes integer not null default 30;
