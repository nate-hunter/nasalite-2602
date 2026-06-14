-- maps galleries to one or more public page surfaces with display and scheduling controls
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
