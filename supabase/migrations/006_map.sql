-- GPS position for expenses, agenda and history. Run after 001_init.sql.

alter table public."perso-expenses" add column if not exists map_lat double precision;
alter table public."perso-expenses" add column if not exists map_lng double precision;
alter table public."perso-expenses" add column if not exists map_label text;

alter table public."perso-agenda-events" add column if not exists map_lat double precision;
alter table public."perso-agenda-events" add column if not exists map_lng double precision;
alter table public."perso-agenda-events" add column if not exists map_label text;

alter table public."perso-history" add column if not exists map_lat double precision;
alter table public."perso-history" add column if not exists map_lng double precision;
alter table public."perso-history" add column if not exists map_label text;
