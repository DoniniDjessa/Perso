-- Ensure agenda priority exists and refresh the API schema cache.
-- Run this in the Supabase SQL editor if editing priority does not persist.

alter table public."perso-agenda-events"
  add column if not exists priority integer not null default 2;

alter table public."perso-agenda-events"
  drop constraint if exists perso_agenda_priority_range;

alter table public."perso-agenda-events"
  add constraint perso_agenda_priority_range check (priority between 1 and 3);

notify pgrst, 'reload schema';
