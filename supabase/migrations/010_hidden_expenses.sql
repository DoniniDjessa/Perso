-- Hidden expenses stay in totals. Unlocked in the app with a privacy PIN.

alter table public."perso-expenses"
  add column if not exists hidden boolean not null default false;

alter table public."perso-profiles"
  add column if not exists hide_code_hash text;
