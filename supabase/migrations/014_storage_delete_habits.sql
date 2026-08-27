-- Storage API delete (direct DELETE on storage.objects is blocked).
-- Also re-apply habit columns + reload PostgREST cache.

create or replace function public.perso_delete_parent_images()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  p text;
begin
  foreach p in array array_remove(ARRAY[
    to_jsonb(old)->>'image_path',
    to_jsonb(old)->>'avatar_path',
    to_jsonb(old)->>'audio_path',
    to_jsonb(old)->>'video_path'
  ], null)
  loop
    if p is null or length(trim(p)) = 0 then
      continue;
    end if;
    begin
      perform storage.delete_object('perso-bucket', p);
    exception
      when others then
        null;
    end;
  end loop;
  return old;
end;
$$;

alter table public."perso-todos"
  add column if not exists kind text not null default 'once';

alter table public."perso-todos"
  add column if not exists habit jsonb;

alter table public."perso-todos"
  drop constraint if exists perso_todos_kind_check;

alter table public."perso-todos"
  add constraint perso_todos_kind_check check (kind in ('once', 'habit'));

notify pgrst, 'reload schema';
