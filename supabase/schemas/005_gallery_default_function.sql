-- returns the user's default gallery id, creating one with title 'Uploads' if none exists
create or replace function public.get_or_create_default_gallery(p_user_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_gallery_id uuid;
  v_email_local text;
  v_slug_base text;
  v_slug text;
begin
  select id into v_gallery_id from public.galleries where creator_id = p_user_id and is_default = true;
  if v_gallery_id is not null then
    return v_gallery_id;
  end if;

  select
    split_part(coalesce(public.user_profiles.email, ''), '@', 1)
  into v_email_local
  from public.user_profiles
  where public.user_profiles.id = p_user_id;

  v_slug_base := trim(
    both '-'
    from lower(regexp_replace(coalesce(v_email_local, ''), '[^a-zA-Z0-9]+', '-', 'g'))
  );
  if v_slug_base = '' then
    v_slug_base := 'user';
  end if;

  v_slug := 'uploads-' || v_slug_base || '-' || left(replace(p_user_id::text, '-', ''), 8);

  begin
    insert into public.galleries (creator_id, title, slug, description, is_default)
    values (p_user_id, 'Uploads', v_slug, 'Default gallery for all uploaded media.', true)
    returning id into v_gallery_id;
  exception when unique_violation then
    select id into v_gallery_id from public.galleries where creator_id = p_user_id and is_default = true;
  end;
  return v_gallery_id;
end;
$$;

-- optional: enforce default gallery title 'Uploads'
create or replace function public.check_default_gallery_title_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.is_default = true and old.is_default = true and old.title = 'Uploads' and new.title != 'Uploads' then
    raise exception 'Cannot change the title of the default "Uploads" gallery.';
  end if;
  if new.is_default = true and new.title != 'Uploads' then
    raise exception 'Default galleries must have the title "Uploads".';
  end if;
  return new;
end;
$$;

drop trigger if exists check_default_gallery_title_update on public.galleries;
create trigger check_default_gallery_title_update
  before update on public.galleries
  for each row execute function public.check_default_gallery_title_update();
