-- migration: enforce non-nullability for galleries visibility and creation timestamp
-- purpose: ensure `public.galleries.is_public` and `public.galleries.created_at` cannot be null
-- affected objects: public.galleries (columns: is_public, created_at)
-- special considerations:
--   1) existing rows are backfilled before `set not null` to avoid migration failure
--   2) defaults are restated to preserve insert behavior and generated type expectations

begin;

-- backfill existing null visibility values before adding the not-null constraint.
update public.galleries
set is_public = false
where is_public is null;

-- backfill existing null creation timestamps before adding the not-null constraint.
update public.galleries
set created_at = now()
where created_at is null;

-- enforce non-nullability and keep defaults for forward compatibility.
alter table public.galleries
  alter column is_public set default false,
  alter column is_public set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

commit;
