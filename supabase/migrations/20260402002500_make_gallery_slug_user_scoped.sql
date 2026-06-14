-- migration: make gallery slug uniqueness user scoped
-- purpose: allow different users to use the same gallery slug/title while preserving per-user uniqueness.
-- affected: public.galleries

-- remove global slug uniqueness
drop index if exists public.galleries_slug_unique_idx;

-- enforce slug uniqueness per gallery creator
create unique index if not exists galleries_creator_slug_unique_idx
  on public.galleries (creator_id, slug);
