-- migration: add_anon_read_policies_for_public_gallery_view
-- purpose: enable least-privilege anon reads on galleries, gallery_media_items, and
--          gallery_page_assignments so the public /galleries/wedding-memories page can
--          use the anon/session supabase client instead of the service-role client.
-- affected: public.galleries (new anon select policy)
--           public.gallery_media_items (new anon select policy)
--           public.gallery_page_assignments (enable rls + new anon select policy)
-- notes:
--   - existing authenticated policies on all three tables are untouched.
--   - gallery_page_assignments was created without rls in migration
--     20260401235959_add_gallery_slug_and_page_assignments.sql; this migration
--     enables it and adds only the narrowest anon read required.
--   - anon visibility is gated on gallery_page_assignments: a gallery must be
--     explicitly assigned to a public page (is_active = true) by a super_admin
--     before anon can read it. this prevents anon from seeing any authenticated
--     user's gallery even if that gallery is marked is_public = true.
--   - no anon write access is granted on any table.

-- =============================================================================
-- table rls: galleries (anon select — page-assigned public galleries only)
-- =============================================================================

-- anon can only read galleries that are:
--   1. marked is_public = true, AND
--   2. explicitly assigned to a public page via gallery_page_assignments (is_active = true).
-- this ensures regular authenticated-user galleries (which are never page-assigned)
-- remain invisible to anon even if their is_public flag is true.
-- the existing authenticated policy (creator_id = auth.uid() or is_public = true)
-- is not changed.
-- qualify galleries.id as public.galleries.id: unqualified "id" inside the exists
-- subquery would resolve to gpa.id (gallery_page_assignments also has an id column),
-- making gallery_id = id almost never true and hiding every gallery from anon.
create policy "Anon can view page-assigned public galleries"
  on public.galleries for select to anon
  using (
    is_public = true
    and exists (
      select 1
      from public.gallery_page_assignments gpa
      where gpa.gallery_id = public.galleries.id
        and gpa.is_active = true
    )
  );

-- =============================================================================
-- table rls: gallery_media_items (anon select — via page-assigned public gallery only)
-- =============================================================================

-- anon can read gallery_media_items rows only when the linked gallery is both
-- public and assigned to an active page. inherits the same gate as the galleries
-- anon policy above, preventing traversal of private or unassigned gallery memberships.
-- the existing authenticated policy (gallery visible to user) is not changed.
create policy "Anon can view media items in page-assigned public galleries"
  on public.gallery_media_items for select to anon
  using (
    exists (
      select 1
      from public.galleries g
      where g.id = gallery_id
        and g.is_public = true
        and exists (
          select 1
          from public.gallery_page_assignments gpa
          where gpa.gallery_id = g.id
            and gpa.is_active = true
        )
    )
  );

-- =============================================================================
-- table rls: gallery_page_assignments (enable rls + anon select — active only)
-- =============================================================================

-- enable rls on gallery_page_assignments; it was created without rls enabled.
-- without this, all rows are visible to all callers regardless of policies below.
alter table public.gallery_page_assignments enable row level security;

-- anon can read active page assignments (is_active = true).
-- the api route additionally filters by page_slug and enforces date-window checks
-- in application code, so this policy only needs to allow the broad active set.
create policy "Anon can view active page assignments"
  on public.gallery_page_assignments for select to anon
  using (is_active = true);

-- authenticated users can read all page assignments (active and inactive)
-- to support admin tooling that needs to see scheduled/disabled assignments.
create policy "Authenticated can view all page assignments"
  on public.gallery_page_assignments for select to authenticated
  using (true);

-- only super_admin users can insert, update, or delete page assignments.
-- using app_role = 'super_admin' (not created_by = auth.uid()) because:
--   1. created_by is a nullable audit column — null = auth.uid() is always null
--      (not true), so a created_by-based check would silently reject every insert.
--   2. page assignments are an admin curation action, not a user-ownership action;
--      the correct gate is role, consistent with all other super_admin policies
--      in this project (storage.objects, media_items insert/update/delete).
create policy "Super admin can create page assignments"
  on public.gallery_page_assignments for insert to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and app_role = 'super_admin'
    )
  );

create policy "Super admin can update page assignments"
  on public.gallery_page_assignments for update to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and app_role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and app_role = 'super_admin'
    )
  );

create policy "Super admin can delete page assignments"
  on public.gallery_page_assignments for delete to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and app_role = 'super_admin'
    )
  );
