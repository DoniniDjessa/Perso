-- History people, audio, video and external links. Run after 004_history.sql / 006_map.sql.

alter table public."perso-history" add column if not exists people jsonb not null default '[]'::jsonb;
alter table public."perso-history" add column if not exists audio_path text;
alter table public."perso-history" add column if not exists video_path text;
alter table public."perso-history" add column if not exists links jsonb not null default '[]'::jsonb;

create or replace function public.perso_delete_parent_images()
returns trigger
language plpgsql
security definer
set search_path = storage, public
as $$
begin
  delete from storage.objects
  where bucket_id = 'perso-bucket'
    and (
      (to_jsonb(old)->>'image_path' is not null and name = to_jsonb(old)->>'image_path')
      or (to_jsonb(old)->>'avatar_path' is not null and name = to_jsonb(old)->>'avatar_path')
      or (to_jsonb(old)->>'audio_path' is not null and name = to_jsonb(old)->>'audio_path')
      or (to_jsonb(old)->>'video_path' is not null and name = to_jsonb(old)->>'video_path')
      or name like old.id::text || '/%'
      or name like '%/' || old.id::text || '/%'
    );

  return old;
end;
$$;
