-- junction table linking galleries to media items (many-to-many)
create table if not exists public.gallery_media_items (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  media_item_id uuid not null references public.media_items(id) on delete cascade,
  added_by uuid references public.user_profiles(id) on delete set null,
  added_at timestamptz default now(),
  constraint gallery_media_items_gallery_media_unique unique (gallery_id, media_item_id)
);
