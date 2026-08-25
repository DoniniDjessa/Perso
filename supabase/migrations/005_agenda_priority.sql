-- Agenda event priority (1 basse, 2 moyenne, 3 haute). Run after 001_init.sql.

alter table public."perso-agenda-events"
  add column if not exists priority integer not null default 2;

alter table public."perso-agenda-events"
  drop constraint if exists perso_agenda_priority_range;

alter table public."perso-agenda-events"
  add constraint perso_agenda_priority_range check (priority between 1 and 3);

notify pgrst, 'reload schema';
