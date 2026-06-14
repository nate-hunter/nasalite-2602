-- migration: enforce non-nullability for media_items generated/media timestamp fields
-- purpose: ensure `public.media_items.media_type` and `public.media_items.created_at` cannot be null
-- affected objects: public.media_items (columns: media_type, created_at)
-- special considerations:
--   1) `media_type` is a stored generated column from non-null `mime_type`; this migration codifies the invariant.
--   2) existing null `created_at` values are backfilled before `set not null`.

begin;

-- backfill existing null creation timestamps before adding the not-null constraint.
update public.media_items
set created_at = now()
where created_at is null;

-- enforce non-nullability and keep default for future inserts.
alter table public.media_items
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column media_type set not null;

commit;
