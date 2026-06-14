-- migration: add_is_app_gallery_to_galleries
-- purpose: add an explicit boolean flag to distinguish admin-curated, app-facing
--          galleries (is_app_gallery = true) from personal user galleries
--          (is_app_gallery = false, the default). this allows upload forms to filter
--          the gallery selector by context:
--            - user upload (/media/upload)  → is_app_gallery = false
--            - admin upload (/admin/media)  → is_app_gallery = true
-- affected: public.galleries (new column, updated insert/update rls policies)
-- notes:
--   - column defaults to false so all new galleries are treated as personal galleries
--     unless explicitly set to true by a super_admin.
--   - no backfill is included: supabase db reset replays migrations on a clean db,
--     so there are no pre-existing rows to update. for a production deployment with
--     existing app galleries, run a targeted update manually at deploy time:
--       update public.galleries set is_app_gallery = true
--       where exists (select 1 from public.gallery_page_assignments gpa where gpa.gallery_id = id);
--   - the existing insert and update rls policies are dropped and recreated to restrict
--     setting is_app_gallery = true to super_admin users only. regular authenticated
--     users can only create/update galleries where is_app_gallery = false.

-- =============================================================================
-- add is_app_gallery column
-- =============================================================================

-- safe to add not null with a default: no existing rows are affected (all get false).
alter table public.galleries
  add column is_app_gallery boolean not null default false;

-- =============================================================================
-- rls: galleries insert — restrict is_app_gallery = true to super_admin
-- =============================================================================

-- drop the existing insert policy so we can replace it with the tightened version.
-- the original policy only checked creator_id = auth.uid(), which allowed any
-- authenticated user to set is_app_gallery = true via a direct api call.
drop policy "Authenticated can create own galleries" on public.galleries;

-- recreate with an additional check: regular users may only create galleries with
-- is_app_gallery = false (the db default). super_admin users may set it to true
-- to mark a gallery as app-facing.
create policy "Authenticated can create own galleries"
  on public.galleries for insert to authenticated
  with check (
    creator_id = auth.uid()
    and (
      is_app_gallery = false
      or exists (
        select 1 from public.user_profiles
        where id = auth.uid() and app_role = 'super_admin'
      )
    )
  );

-- =============================================================================
-- rls: galleries update — restrict is_app_gallery = true to super_admin
-- =============================================================================

-- drop the existing update policy for the same reason as insert above.
drop policy "Authenticated can update own galleries" on public.galleries;

-- recreate with the same is_app_gallery restriction in with check.
-- the using clause (ownership) is unchanged: users can only update their own galleries.
-- the with check clause additionally prevents a non-super-admin from flipping
-- is_app_gallery to true on an existing gallery.
create policy "Authenticated can update own galleries"
  on public.galleries for update to authenticated
  using (creator_id = auth.uid())
  with check (
    creator_id = auth.uid()
    and (
      is_app_gallery = false
      or exists (
        select 1 from public.user_profiles
        where id = auth.uid() and app_role = 'super_admin'
      )
    )
  );
