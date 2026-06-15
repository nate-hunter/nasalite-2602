
  create table "public"."galleries" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "is_public" boolean default false,
    "is_default" boolean not null default false,
    "creator_id" uuid not null,
    "cover_image_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."gallery_media_items" (
    "id" uuid not null default gen_random_uuid(),
    "gallery_id" uuid not null,
    "media_item_id" uuid not null,
    "added_by" uuid,
    "added_at" timestamp with time zone default now()
      );



  create table "public"."media_items" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null default ''::text,
    "description" text,
    "is_public" boolean default false,
    "project_name" text default 'WEDDING_MEMORIES'::text,
    "filename" text not null,
    "original_filename" text not null,
    "file_path" text not null,
    "bucket_id" text not null default 'media-items'::text,
    "file_size" bigint,
    "mime_type" text not null,
    "media_type" text generated always as (
CASE
    WHEN (mime_type ~~ 'image/%'::text) THEN 'photo'::text
    WHEN (mime_type ~~ 'video/%'::text) THEN 'video'::text
    ELSE 'other'::text
END) stored,
    "width" integer,
    "height" integer,
    "duration" interval,
    "uploader_id" uuid,
    "imagekit_file_id" character varying(255),
    "imagekit_url" text,
    "thumbnail_url" text,
    "original_format" character varying(20),
    "was_converted" boolean default false,
    "conversion_metadata" jsonb,
    "lat" numeric(10,8),
    "lon" numeric(11,8),
    "exif_data" jsonb,
    "location_name" text,
    "camera_make" text,
    "camera_model" text,
    "date_taken" timestamp with time zone,
    "source" text not null default 'guest'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


CREATE UNIQUE INDEX galleries_creator_id_is_default_unique_idx ON public.galleries USING btree (creator_id) WHERE (is_default = true);

CREATE UNIQUE INDEX galleries_pkey ON public.galleries USING btree (id);

CREATE UNIQUE INDEX gallery_media_items_gallery_media_unique ON public.gallery_media_items USING btree (gallery_id, media_item_id);

CREATE UNIQUE INDEX gallery_media_items_pkey ON public.gallery_media_items USING btree (id);

CREATE INDEX idx_media_items_bucket_public ON public.media_items USING btree (bucket_id, is_public);

CREATE INDEX idx_media_items_created_at ON public.media_items USING btree (created_at DESC);

CREATE INDEX idx_media_items_file_path ON public.media_items USING btree (file_path);

CREATE INDEX idx_media_items_imagekit_file_id ON public.media_items USING btree (imagekit_file_id) WHERE (imagekit_file_id IS NOT NULL);

CREATE INDEX idx_media_items_media_type ON public.media_items USING btree (media_type);

CREATE INDEX idx_media_items_original_format ON public.media_items USING btree (original_format) WHERE (original_format IS NOT NULL);

CREATE INDEX idx_media_items_uploader_id ON public.media_items USING btree (uploader_id);

CREATE INDEX idx_media_items_was_converted ON public.media_items USING btree (was_converted) WHERE (was_converted = true);

CREATE UNIQUE INDEX media_items_pkey ON public.media_items USING btree (id);

alter table "public"."galleries" add constraint "galleries_pkey" PRIMARY KEY using index "galleries_pkey";

alter table "public"."gallery_media_items" add constraint "gallery_media_items_pkey" PRIMARY KEY using index "gallery_media_items_pkey";

alter table "public"."media_items" add constraint "media_items_pkey" PRIMARY KEY using index "media_items_pkey";

alter table "public"."galleries" add constraint "galleries_cover_image_id_fkey" FOREIGN KEY (cover_image_id) REFERENCES public.media_items(id) ON DELETE SET NULL not valid;

alter table "public"."galleries" validate constraint "galleries_cover_image_id_fkey";

alter table "public"."galleries" add constraint "galleries_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."galleries" validate constraint "galleries_creator_id_fkey";

alter table "public"."gallery_media_items" add constraint "gallery_media_items_added_by_fkey" FOREIGN KEY (added_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."gallery_media_items" validate constraint "gallery_media_items_added_by_fkey";

alter table "public"."gallery_media_items" add constraint "gallery_media_items_gallery_id_fkey" FOREIGN KEY (gallery_id) REFERENCES public.galleries(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_media_items" validate constraint "gallery_media_items_gallery_id_fkey";

alter table "public"."gallery_media_items" add constraint "gallery_media_items_gallery_media_unique" UNIQUE using index "gallery_media_items_gallery_media_unique";

alter table "public"."gallery_media_items" add constraint "gallery_media_items_media_item_id_fkey" FOREIGN KEY (media_item_id) REFERENCES public.media_items(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_media_items" validate constraint "gallery_media_items_media_item_id_fkey";

alter table "public"."media_items" add constraint "check_media_item_bucket" CHECK ((bucket_id = ANY (ARRAY['media-items'::text, 'app-media-items'::text]))) not valid;

alter table "public"."media_items" validate constraint "check_media_item_bucket";

alter table "public"."media_items" add constraint "check_media_item_source" CHECK ((source = ANY (ARRAY['guest'::text, 'vendor'::text, 'admin'::text]))) not valid;

alter table "public"."media_items" validate constraint "check_media_item_source";

alter table "public"."media_items" add constraint "check_media_item_source_bucket" CHECK ((((source = 'admin'::text) AND (bucket_id = 'app-media-items'::text)) OR ((source <> 'admin'::text) AND (bucket_id = 'media-items'::text)))) not valid;

alter table "public"."media_items" validate constraint "check_media_item_source_bucket";

alter table "public"."media_items" add constraint "media_items_uploader_id_fkey" FOREIGN KEY (uploader_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."media_items" validate constraint "media_items_uploader_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_default_gallery_title_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.is_default = true and old.is_default = true and old.title = 'Uploads' and new.title != 'Uploads' then
    raise exception 'Cannot change the title of the default "Uploads" gallery.';
  end if;
  if new.is_default = true and new.title != 'Uploads' then
    raise exception 'Default galleries must have the title "Uploads".';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_default_gallery(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_gallery_id uuid;
begin
  select id into v_gallery_id from public.galleries where creator_id = p_user_id and is_default = true;
  if v_gallery_id is not null then
    return v_gallery_id;
  end if;
  begin
    insert into public.galleries (creator_id, title, description, is_default)
    values (p_user_id, 'Uploads', 'Default gallery for all uploaded media.', true)
    returning id into v_gallery_id;
  exception when unique_violation then
    select id into v_gallery_id from public.galleries where creator_id = p_user_id and is_default = true;
  end;
  return v_gallery_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."galleries" to "anon";

grant insert on table "public"."galleries" to "anon";

grant references on table "public"."galleries" to "anon";

grant select on table "public"."galleries" to "anon";

grant trigger on table "public"."galleries" to "anon";

grant truncate on table "public"."galleries" to "anon";

grant update on table "public"."galleries" to "anon";

grant delete on table "public"."galleries" to "authenticated";

grant insert on table "public"."galleries" to "authenticated";

grant references on table "public"."galleries" to "authenticated";

grant select on table "public"."galleries" to "authenticated";

grant trigger on table "public"."galleries" to "authenticated";

grant truncate on table "public"."galleries" to "authenticated";

grant update on table "public"."galleries" to "authenticated";

grant delete on table "public"."galleries" to "service_role";

grant insert on table "public"."galleries" to "service_role";

grant references on table "public"."galleries" to "service_role";

grant select on table "public"."galleries" to "service_role";

grant trigger on table "public"."galleries" to "service_role";

grant truncate on table "public"."galleries" to "service_role";

grant update on table "public"."galleries" to "service_role";

grant delete on table "public"."gallery_media_items" to "anon";

grant insert on table "public"."gallery_media_items" to "anon";

grant references on table "public"."gallery_media_items" to "anon";

grant select on table "public"."gallery_media_items" to "anon";

grant trigger on table "public"."gallery_media_items" to "anon";

grant truncate on table "public"."gallery_media_items" to "anon";

grant update on table "public"."gallery_media_items" to "anon";

grant delete on table "public"."gallery_media_items" to "authenticated";

grant insert on table "public"."gallery_media_items" to "authenticated";

grant references on table "public"."gallery_media_items" to "authenticated";

grant select on table "public"."gallery_media_items" to "authenticated";

grant trigger on table "public"."gallery_media_items" to "authenticated";

grant truncate on table "public"."gallery_media_items" to "authenticated";

grant update on table "public"."gallery_media_items" to "authenticated";

grant delete on table "public"."gallery_media_items" to "service_role";

grant insert on table "public"."gallery_media_items" to "service_role";

grant references on table "public"."gallery_media_items" to "service_role";

grant select on table "public"."gallery_media_items" to "service_role";

grant trigger on table "public"."gallery_media_items" to "service_role";

grant truncate on table "public"."gallery_media_items" to "service_role";

grant update on table "public"."gallery_media_items" to "service_role";

grant delete on table "public"."media_items" to "anon";

grant insert on table "public"."media_items" to "anon";

grant references on table "public"."media_items" to "anon";

grant select on table "public"."media_items" to "anon";

grant trigger on table "public"."media_items" to "anon";

grant truncate on table "public"."media_items" to "anon";

grant update on table "public"."media_items" to "anon";

grant delete on table "public"."media_items" to "authenticated";

grant insert on table "public"."media_items" to "authenticated";

grant references on table "public"."media_items" to "authenticated";

grant select on table "public"."media_items" to "authenticated";

grant trigger on table "public"."media_items" to "authenticated";

grant truncate on table "public"."media_items" to "authenticated";

grant update on table "public"."media_items" to "authenticated";

grant delete on table "public"."media_items" to "service_role";

grant insert on table "public"."media_items" to "service_role";

grant references on table "public"."media_items" to "service_role";

grant select on table "public"."media_items" to "service_role";

grant trigger on table "public"."media_items" to "service_role";

grant truncate on table "public"."media_items" to "service_role";

grant update on table "public"."media_items" to "service_role";

CREATE TRIGGER check_default_gallery_title_update BEFORE UPDATE ON public.galleries FOR EACH ROW EXECUTE FUNCTION public.check_default_gallery_title_update();

CREATE TRIGGER update_galleries_updated_at BEFORE UPDATE ON public.galleries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_items_updated_at BEFORE UPDATE ON public.media_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


