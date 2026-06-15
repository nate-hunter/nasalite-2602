-- migration: add gallery slug and page assignments
-- purpose: add stable gallery slug identifiers and a many-to-many page placement table
-- affected: public.galleries, public.gallery_page_assignments
-- notes:
--   1) backfill generates deterministic, collision-safe slugs from existing titles.
--   2) duplicate slugs are suffixed with `--{n}` to avoid collisions with natural `-n` titles.

-- =============================================================================
-- add slug to galleries and backfill existing rows
-- =============================================================================

alter table public.galleries
add column slug text;

with
  prepared as (
    select
      public.galleries.id,
      coalesce(public.galleries.created_at, now()) as created_at,
      trim(
        both '-'
        from lower(regexp_replace(trim(public.galleries.title), '[^a-zA-Z0-9]+', '-', 'g'))
      ) as base_slug
    from public.galleries
  ),
  normalized as (
    select
      prepared.id,
      prepared.created_at,
      case
        when prepared.base_slug = '' then 'gallery'
        else prepared.base_slug
      end as normalized_slug
    from prepared
  ),
  ranked as (
    select
      normalized.id,
      normalized.normalized_slug,
      row_number() over (
        partition by normalized.normalized_slug
        order by normalized.created_at, normalized.id
      ) as slug_rank
    from normalized
  )
update public.galleries
set slug = case
  when ranked.slug_rank = 1 then ranked.normalized_slug
  else ranked.normalized_slug || '--' || ranked.slug_rank::text
end
from ranked
where public.galleries.id = ranked.id
  and public.galleries.slug is null;

alter table public.galleries
alter column slug set not null;

create unique index if not exists galleries_slug_unique_idx
  on public.galleries (slug);

-- =============================================================================
-- create gallery page assignment table
-- =============================================================================

create table if not exists public.gallery_page_assignments (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  page_slug text not null,
  display_order integer not null default 0 check (display_order >= 0),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  constraint gallery_page_assignments_gallery_page_unique unique (gallery_id, page_slug),
  constraint gallery_page_assignments_starts_before_ends check (
    starts_at is null
    or ends_at is null
    or starts_at <= ends_at
  )
);

create index if not exists gallery_page_assignments_lookup_idx
  on public.gallery_page_assignments (page_slug, is_active, display_order);

create trigger update_gallery_page_assignments_updated_at
  before update on public.gallery_page_assignments
  for each row execute function public.update_updated_at_column();
