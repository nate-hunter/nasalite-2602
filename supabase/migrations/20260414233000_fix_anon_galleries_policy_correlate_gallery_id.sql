-- migration: fix_anon_galleries_policy_correlate_gallery_id
-- purpose: replace the anon select policy on public.galleries so the exists subquery
--          correlates on public.galleries.id, not gpa.id (ambiguous unqualified "id").
-- affected: public.galleries (policy "Anon can view page-assigned public galleries")
-- notes:
--   if migration 20260408120000 was already applied, the old policy used
--   "gpa.gallery_id = id" which postgres resolves as gpa.gallery_id = gpa.id,
--   hiding all galleries from anon. this migration drops and recreates the policy.

drop policy if exists "Anon can view page-assigned public galleries" on public.galleries;

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
