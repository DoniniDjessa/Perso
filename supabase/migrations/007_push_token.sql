-- Expo push token for remote notifications. Run after 003_notifs_people.sql.

alter table public."perso-profiles" add column if not exists push_token text;
