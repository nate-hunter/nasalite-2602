# Media Storage and Delivery: Architecture Reference

> **Project:** *Lisa + Nate Memories* — a personal photo and video platform built solo, end-to-end, for sharing memories with family and friends. Live at [lisaplusnate.us](https://lisaplusnate.us).
>
> **Background:** The project began with the intention of using Google's Photos Library API as the storage backend. Before that integration was completed, Google restricted API access in 2025, requiring a rethink of the entire storage and delivery model from scratch.
>
> **Requirements:** large file support (phone photos up to 100 MiB, videos up to 5 GB), HEIC/HEIF format handling, on-the-fly CDN transforms for responsive delivery, fine-grained access control between private guest uploads and public curated content, and operational simplicity for a solo-maintained project.
>
> **See also:** [MEDIA_ARCHITECTURE_ADRS.md](./MEDIA_ARCHITECTURE_ADRS.md) — Architecture Decision Records covering the key design choices and rationale behind this architecture.

---

## Table of Contents

1. [Conceptual Overview](#conceptual-overview)
2. [System Components](#system-components)
3. [Upload Flows](#upload-flows)
4. [Display and Delivery](#display-and-delivery)
5. [Data Model](#data-model)
6. [Storage Buckets](#storage-buckets)
7. [Design Rationale Summary](#design-rationale-summary)

---

## Conceptual Overview

The architecture implements a **Supabase-as-origin, ImageKit-as-CDN** model:

| Layer | Role |
|-------|------|
| **Supabase Storage** | Single source of truth for all original files |
| **Postgres** | Rich, queryable metadata; gallery organization; public page assignments |
| **ImageKit** | Global CDN and on-the-fly transformation engine (fetches from Supabase S3-compatible origins on cache miss) |
| **Next.js API routes** | Auth, signed upload URLs, metadata finalization, download proxy — never file-byte proxy for uploads |

Originals exist in exactly one place (Supabase). ImageKit holds no primary copy — only transformed cache at the edge.

There are **two distinct upload pipelines**, distinguished by storage bucket and access model:

| Pipeline | Bucket | Who uploads | Visibility |
|----------|--------|-------------|------------|
| Guest uploads | `media-items` (private) | Authenticated guests | Private by default |
| Admin / app content | `app-media-items` (public) | `super_admin` only | Public curated gallery + admin UI |

---

## System Components

**Client (browser)**
- File selection, queue management, EXIF extraction
- HEIC/HEIF: temporary preview upload to ImageKit before permanent storage (see [ADR-005](./MEDIA_ARCHITECTURE_ADRS.md#adr-005-heicheif-preview-via-temporary-imagekit-upload-before-permanent-storage-completes))
- Direct upload to Supabase Storage (signed URL for photos; TUS resumable for videos)
- Calls finalize endpoint after storage upload completes

**Application server (Next.js API routes)**

| Route | Responsibility |
|-------|----------------|
| `POST /api/media/request-upload-url` | Authenticate, generate storage path, issue signed upload URL |
| `POST /api/media/finalize-upload` | Reverse geocode GPS, insert `media_items` row, link to gallery |
| `POST /api/media/cleanup-preview` | Delete HEIC temp preview from ImageKit |
| `GET /api/imagekit-auth` | ImageKit upload auth params (HEIC previews only) |
| `GET /api/media/download` | Same-origin download proxy (both buckets) |

**Supabase**
- Auth + `user_profiles` (including `app_role`: `authenticated` | `super_admin`)
- Storage buckets with RLS on `storage.objects`
- Postgres tables: `media_items`, `galleries`, `gallery_media_items`, `gallery_page_assignments`

**ImageKit**
- Two S3-compatible external origins pointed at Supabase hosted storage (path-style)
- `app-media-items` → unsigned public delivery
- `media-items` → signed delivery for private files
- HEIC temp previews: uploaded to ImageKit Media Library via REST API; deleted after permanent upload completes

---

## Upload Flows

**High-level sequence**

```
User selects file(s)
    ↓
Client: validate type/size, extract EXIF
    ↓
[HEIC/HEIF]  Temp upload to ImageKit → immediate preview URL
[Other types] Local object URL preview
    ↓
POST /api/media/request-upload-url  →  signed path + upload credentials
    ↓
Client uploads directly to Supabase Storage
    • Photos: signed URL flow
    • Videos: TUS resumable with chunked transfer and retry backoff
    ↓
POST /api/media/finalize-upload  →  DB record + gallery links
    ↓
[HEIC] POST /api/media/cleanup-preview (async, non-fatal)
```

**Guest upload (`media-items` bucket)**

1. EXIF extraction — client-side; captures GPS, camera make/model, `date_taken`, full EXIF JSON.
2. Preview — HEIC uses ImageKit temp upload; other formats use `URL.createObjectURL`.
3. Signed upload URL — server generates canonical path: `users/{user_id}/{year}/{month}/{uuid}-{sanitized_filename}`.
4. Storage upload — photos via signed URL; videos via TUS.
5. Finalize — server sets `source = 'guest'`, `is_public = false`, `bucket_id = 'media-items'`; reverse geocodes GPS if enabled.
6. Default gallery — `get_or_create_default_gallery(user_id)` lazily creates an "Uploads" gallery on first finalize. Every item links to this gallery; an additional gallery can be specified at upload time.

**Admin upload (`app-media-items` bucket)**

Identical client processing. API differences:

| Step | Behavior |
|------|----------|
| Auth guard | `super_admin` required; `403` before any storage or DB work |
| Path | `{year}/{month}/{uuid}-{filename}` — no `users/{id}/` prefix |
| Finalize | `source = 'admin'`, `is_public = true`, `gallery_id` required |
| Gallery link | Direct link to specified app gallery only — no default "Uploads" gallery |

---

## Display and Delivery

**URL construction**

Delivery URLs are computed at render time from `bucket_id` + `file_path` + a named preset. The `imagekit_url` column is not populated at finalize — delivery URL construction is a code concern, not a data concern.

| Preset | Transform | Typical use |
|--------|-----------|-------------|
| `masonry_grid` | `w-400, f-auto` | Public wedding masonry grid |
| `lightbox_full` | `w-1920, f-auto` | Lightbox full-resolution view |
| `admin_thumb` | `w-320, f-auto` | Admin CMS thumbnails |
| `original` | none | Full-size opens, download links |

**Display sequence**

```
Query Postgres for media metadata (file_path, bucket_id, dimensions, …)
    ↓
Build delivery URL (unsigned or signed) + preset
    ↓
Browser requests ImageKit URL
    ↓
Cache hit  → edge serve
Cache miss → ImageKit fetches from Supabase origin, transforms, caches, serves
```

---

## Data Model

**Entity relationships**

```
auth.users ──► user_profiles
                    │
                    ├── media_items (uploader_id)
                    ├── galleries (creator_id)
                    │       │
                    │       ├── gallery_media_items ──► media_items
                    │       ├── cover_image_id ──► media_items (optional FK)
                    │       └── gallery_page_assignments (public page placement)
```

**`media_items`** — one row per file in Supabase Storage.

| Field group | Columns |
|-------------|---------|
| Storage ref | `bucket_id`, `file_path`, `filename`, `original_filename`, `mime_type`, `file_size` |
| Visibility | `is_public`, `source` (`guest` \| `admin`) |
| Capture metadata | `width`, `height`, `lat`, `lon`, `location_name`, `camera_make`, `camera_model`, `date_taken`, `exif_data` |

Source and bucket are kept in sync by a DB-level check constraint:

```sql
constraint check_media_item_source_bucket check (
  (source = 'admin' and bucket_id = 'app-media-items')
  or (source <> 'admin' and bucket_id = 'media-items')
)
```

**`galleries`**

| Column | Purpose |
|--------|---------|
| `is_default` | One "Uploads" gallery per user (unique partial index) |
| `is_public` | Whether the gallery is visible beyond its owner |
| `is_app_gallery` | Admin-curated app gallery vs. personal user gallery |
| `slug` | Unique per `creator_id`; default gallery uses a deterministic slug |

**`gallery_page_assignments`**

Maps galleries to public surfaces (e.g., `page_slug = 'wedding-memories'`) with `display_order`, `is_active`, and an optional `starts_at` / `ends_at` date window. Anonymous read access to a gallery is gated on an **active page assignment**, not on `is_public` alone. This prevents a guest's personal gallery with `is_public = true` from surfacing on the admin-curated public page. Admins control scheduling and curation entirely through the CMS, without deploys.

---

## Storage Buckets

**`media-items` (private)**

| Property | Value |
|----------|-------|
| Public flag | `false` |
| File size limit | 5 GiB |
| Allowed MIME types | JPEG, PNG, GIF, WebP, HEIC, MP4, MOV, AVI |
| Path pattern | `users/{user_id}/{year}/{month}/{uuid}-{filename}` |
| Storage RLS | Users read/write/delete their own path prefix only |
| CDN delivery | Signed URLs |

**`app-media-items` (public)**

| Property | Value |
|----------|-------|
| Public flag | `true` |
| File size limit | 5 GiB |
| Path pattern | `{year}/{month}/{uuid}-{filename}` |
| Storage RLS | `super_admin` write; anonymous + authenticated read |
| CDN delivery | Unsigned URLs |

**Why two buckets?** Mixed public/private content in one bucket would require per-object CDN signing logic — inspecting metadata on every delivery request to decide whether to sign the URL. Splitting by access pattern gives one policy per bucket, simpler RLS, and a clear audit boundary. Both buckets share a single ImageKit endpoint and S3 origin configuration.

---

## Design Rationale Summary

| Decision | Rationale |
|----------|-----------|
| Direct-to-storage uploads | Avoids routing file bytes through a serverless host; scales upload bandwidth independently; TUS handles large videos on unreliable mobile connections |
| Client-side EXIF extraction | EXIF is a cheap header parse on a file the browser already holds; finalize endpoint handles only small JSON metadata |
| Lazy default gallery creation | Users who never upload don't accumulate empty gallery rows; race-safe via unique partial index + exception handler |
| HEIC temp ImageKit preview | Browser cannot natively preview HEIC; temp upload to ImageKit's Media Library buys immediate UX before permanent storage completes; originals stored as HEIC (not converted) |
| On-demand CDN transforms | One original in Supabase; arbitrary derivatives without backfill when transform presets change |
| Two buckets by access pattern | One CDN signing policy per bucket; simpler RLS; prevents accidental public exposure of guest content |
| CDN URLs computed at render, not stored | Changing a CDN transform requires a code deploy, not a data migration |
| Download proxy endpoint | `<a download>` is ignored on cross-origin URLs; proxy also provides the foundation for private `media-items` downloads |
| Page assignments for anonymous access | Prevents `is_public = true` user galleries from surfacing on the admin-curated public page; scheduling and curation live in the CMS |
| Reverse geocode gated by feature flag | Geocoding adds latency; opt-in in development, off by default in local dev |
