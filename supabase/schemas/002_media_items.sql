-- shared trigger function for updated_at (used by media_items and galleries)
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- media items: metadata for files in storage (media-items or app-media-items bucket)
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text,
  is_public boolean default false,
  project_name text default 'WEDDING_MEMORIES',
  filename text not null,
  original_filename text not null,
  file_path text not null,
  bucket_id text not null default 'media-items',
  file_size bigint,
  mime_type text not null,
  media_type text generated always as (
    case
      when mime_type like 'image/%' then 'photo'
      when mime_type like 'video/%' then 'video'
      else 'other'
    end
  ) stored not null,
  width integer,
  height integer,
  duration interval,
  uploader_id uuid references public.user_profiles(id) on delete set null,
  imagekit_file_id varchar(255),
  imagekit_url text,
  thumbnail_url text,
  original_format varchar(20),
  was_converted boolean default false,
  conversion_metadata jsonb,
  lat decimal(10, 8),
  lon decimal(11, 8),
  exif_data jsonb,
  location_name text,
  camera_make text,
  camera_model text,
  date_taken timestamptz,
  source text not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  constraint check_media_item_source check (source in ('guest', 'vendor', 'admin')),
  constraint check_media_item_bucket check (bucket_id in ('media-items', 'app-media-items')),
  constraint check_media_item_source_bucket check (
    (source = 'admin' and bucket_id = 'app-media-items')
    or (source <> 'admin' and bucket_id = 'media-items')
  )
);

create index if not exists idx_media_items_uploader_id on public.media_items(uploader_id);
create index if not exists idx_media_items_media_type on public.media_items(media_type);
create index if not exists idx_media_items_created_at on public.media_items(created_at desc);
create index if not exists idx_media_items_file_path on public.media_items(file_path);
create index if not exists idx_media_items_bucket_public on public.media_items(bucket_id, is_public);

create index if not exists idx_media_items_imagekit_file_id
  on public.media_items(imagekit_file_id)
  where imagekit_file_id is not null;

create index if not exists idx_media_items_was_converted
  on public.media_items(was_converted)
  where was_converted = true;

create index if not exists idx_media_items_original_format
  on public.media_items(original_format)
  where original_format is not null;

create trigger update_media_items_updated_at
  before update on public.media_items
  for each row execute function public.update_updated_at_column();
