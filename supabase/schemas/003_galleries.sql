-- user-created collections of media items; one default gallery per user (e.g. "Uploads")
create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  description text,
  is_public boolean not null default false,
  is_default boolean not null default false,
  creator_id uuid not null references public.user_profiles(id) on delete cascade,
  cover_image_id uuid references public.media_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

create unique index galleries_creator_id_is_default_unique_idx
  on public.galleries (creator_id)
  where is_default = true;

create unique index galleries_creator_slug_unique_idx
  on public.galleries (creator_id, slug);

create trigger update_galleries_updated_at
  before update on public.galleries
  for each row execute function public.update_updated_at_column();
