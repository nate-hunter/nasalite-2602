-- migration: update default uploads slug strategy
-- purpose: ensure per-user default "Uploads" galleries use deterministic, collision-resistant slugs.
-- affected: public.get_or_create_default_gallery, public.galleries
-- notes:
--   1) slug format: uploads-<email_local_part>-<first8_userid>
--   2) when email local part is empty, "user" is used.

-- =============================================================================
-- update function to insert default galleries with slug
-- =============================================================================

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

-- =============================================================================
-- backfill existing default galleries to new slug pattern
-- =============================================================================

with
  defaults as (
    select
      public.galleries.id,
      public.galleries.creator_id,
      trim(
        both '-'
        from lower(
          regexp_replace(
            split_part(coalesce(public.user_profiles.email, ''), '@', 1),
            '[^a-zA-Z0-9]+',
            '-',
            'g'
          )
        )
      ) as email_local_slug
    from public.galleries
    left join public.user_profiles on public.user_profiles.id = public.galleries.creator_id
    where public.galleries.is_default = true
  )
update public.galleries
set slug = 'uploads-'
  || case
    when defaults.email_local_slug = '' then 'user'
    else defaults.email_local_slug
  end
  || '-'
  || left(replace(defaults.creator_id::text, '-', ''), 8)
from defaults
where public.galleries.id = defaults.id;
