# Architecture Decision Records: Media Storage and Delivery

> **Project:** *Lisa + Nate Memories* — a personal photo and video platform built solo, end-to-end, for sharing memories with family and friends. Live at [lisaplusnate.us](https://lisaplusnate.us).
>
> **Context:** The project began with the intention of using Google's Photos Library API as the storage backend. Before that integration was completed, Google restricted API access in 2025, requiring a rethink of the entire storage and delivery model from scratch. These ADRs document the key decisions made during that redesign.
>
> **Requirements:** large file support (phone photos up to 100 MiB, videos up to 5 GB), HEIC/HEIF format handling, on-the-fly CDN transforms for responsive delivery, fine-grained access control between private guest uploads and public curated content, and operational simplicity for a solo-maintained project.
>
> **See also:** [MEDIA_ARCHITECTURE.md](./MEDIA_ARCHITECTURE.md) — full architecture reference (system components, data model, upload flows, delivery model, storage bucket configuration).

---

- [ADR-001: Supabase as storage origin; ImageKit as CDN layer](#adr-001-supabase-as-storage-origin-imagekit-as-cdn-layer)
- [ADR-002: Two storage buckets separated by access pattern](#adr-002-two-storage-buckets-separated-by-access-pattern)
- [ADR-003: Direct-to-storage uploads (browser → Supabase; server issues signed URL only)](#adr-003-direct-to-storage-uploads-browser--supabase-server-issues-signed-url-only)
- [ADR-004: CDN delivery URLs computed at render time from stored path and preset](#adr-004-cdn-delivery-urls-computed-at-render-time-from-stored-path-and-preset)
- [ADR-005: HEIC/HEIF preview via temporary ImageKit upload before permanent storage completes](#adr-005-heicheif-preview-via-temporary-imagekit-upload-before-permanent-storage-completes)

---

## ADR-001: Supabase as storage origin; ImageKit as CDN layer

**Status:** Accepted

**Context**

After the Google API access restriction eliminated the prior backend, I evaluated four alternatives against the project's requirements.

| Alternative | Technical fit | Cost model |
|-------------|--------------|------------|
| **Google Drive** (makeshift storage) | No CDN, no transform capability, fragile unofficial API surface | Free, but non-viable |
| **Cloudinary** | Excellent CDN and on-the-fly transforms; originals stored in Cloudinary | Credit-based: 1 credit = 1 GB storage OR 1 GB bandwidth OR 1,000 transforms — all drawn from the same pool |
| **Cloudflare R2** | Very low storage cost; no egress fees to internet; no native transform pipeline | $0.015/GB storage; free egress; separate cost for Cloudflare Images transform pipeline |
| **Supabase Storage** | Already in use for auth and Postgres; S3-compatible; row-level security natively enforces per-user access paths | $25/month Pro (already required for auth + DB) includes 100 GB storage + 250 GB egress |

**Cost analysis**

The cost structure of each alternative differs meaningfully at personal-project scale.

*Cloudinary* uses a unified credit pool across storage, bandwidth, and transformations. Every unique derived asset — a resized thumbnail, a format-converted preview — is cached and counted toward storage credits. The free tier provides 25 credits/month (approximately 25 GB combined across all dimensions). For a project holding tens of gigabytes of phone photos and videos, Plus at $99/month becomes the realistic entry point. The more significant cost, however, is lock-in: originals live in Cloudinary's storage. Migrating away requires copying every file.

*Cloudflare R2* offers the lowest storage cost ($0.015/GB/month, no egress fees to the internet). But R2 has no native transform pipeline. Cloudflare Images adds on-the-fly resizing at $5 per 1,000 uniquely transformed source images — a workable option, but a second vendor relationship added.

*Supabase Storage + ImageKit* avoids paying for storage in two places. Supabase is already a line item at $25/month for auth, Postgres, and storage combined — the 100 GB storage inclusion covers the project's current needs with no overage. ImageKit's pricing separates external-origin bandwidth from DAM (Media Library) storage: files served from a Supabase external origin never count toward ImageKit's DAM storage quota. Only files uploaded directly to ImageKit's Media Library count — in this architecture, that means only HEIC temp preview files, which are deleted after finalization (see ADR-005). The free tier's 20 GB monthly bandwidth is sufficient for a personal platform at current traffic: ImageKit delivers optimized WebP/JPEG derivatives (a 4 MB phone photo typically renders as a 150–300 KB WebP at masonry-grid width), so 20 GB covers a substantial number of gallery views before an upgrade is needed.

**Decision**

Use Supabase Storage as the single source of truth for all originals. Configure ImageKit with two S3-compatible origins pointed at the Supabase project's storage endpoint. Originals never move; ImageKit's edge cache is the only CDN layer.

**Consequences**

- Supabase holds originals regardless of CDN changes. Switching CDN providers in the future requires no data migration — only a configuration change.
- Changing a transform preset (e.g., widening thumbnails from 320px to 400px) requires no database backfill, only a code change to the preset definition.
- No storage vendor lock-in and no double-storage cost: originals live in Supabase; ImageKit caches only derived copies at the edge and holds no primary copy.
- On a cache miss, ImageKit adds one round-trip to fetch from Supabase. For a personal project with relatively static content and a warm CDN, this is acceptable.
- Development against local Supabase requires a fallback: ImageKit origins read hosted storage only, so local dev falls back to Supabase public object URLs directly.

---

## ADR-002: Two storage buckets separated by access pattern

**Status:** Accepted

**Context**

The application has two distinct uploaders with different trust and visibility requirements:

- **Guests** (authenticated users) upload personal memories. Files are private by default and should never be publicly visible unless explicitly promoted.
- **Super admin** uploads curated app content (wedding photos, event galleries) intended for public display.

One design option is a single bucket with per-object access logic — signing each delivery URL individually based on per-row metadata. The alternative is splitting by access pattern into two buckets with distinct policies.

**Decision**

Create two buckets:

- `media-items` — private; path-scoped to `users/{user_id}/…`; RLS restricts each user to their own path prefix; CDN delivery requires signed URLs.
- `app-media-items` — public; flat path at `{year}/{month}/…`; publicly readable; CDN delivery uses unsigned URLs.

**Consequences**

- One CDN signing policy per bucket rather than per-object conditional logic. The private bucket uses ImageKit signed URL delivery; the public bucket uses unsigned delivery. Mixing both patterns in a single bucket would require the CDN layer to inspect per-object metadata to decide signing behavior on every request.
- RLS is simpler: the private bucket's policy is a single path-prefix check; the public bucket grants anon read. No cross-bucket policy bleed.
- The split creates a clear audit boundary. A `super_admin` cannot accidentally place a guest's private file in the public bucket — the API enforces `source = 'admin'` ↔ `bucket_id = 'app-media-items'` via a DB-level check constraint, not just application code.
- Introducing a third access class in the future (e.g., semi-public shared albums) would require a new bucket or policy revision, not rewriting existing per-object logic.

---

## ADR-003: Direct-to-storage uploads (browser → Supabase; server issues signed URL only)

**Status:** Accepted

**Context**

A conventional server-proxied upload flow routes file bytes through the application server: browser → Next.js → Supabase Storage. For a project with videos up to 5 GB, this is untenable on a serverless host — Vercel function memory limits, execution time limits, and egress cost make proxying large files impractical.

The alternative is a signed upload URL pattern: the server authenticates the request, generates a time-limited signed URL scoped to the correct storage path, and returns it to the client. The client uploads directly to Supabase; the server never handles file bytes.

**Decision**

`POST /api/media/request-upload-url` authenticates the user, applies role checks, generates a canonical storage path, and returns a signed upload URL. The client uploads directly. After the upload completes, the client calls `POST /api/media/finalize-upload`, which handles post-upload work: reverse geocoding GPS coordinates, inserting the `media_items` record, linking to galleries.

Videos use the TUS resumable protocol with chunked transfers and retry backoff, allowing a guest uploading a 2 GB video on a mobile connection to recover from a dropped signal without restarting.

**Consequences**

- Server never proxies file bytes for uploads; upload bandwidth scales independently of application server capacity.
- The finalize endpoint is focused: it receives small JSON (metadata, EXIF, path reference) rather than binary file data.
- Server-side inspection of file content (e.g., magic byte validation) is not possible in this model. The storage bucket's allowed MIME type configuration and client-side file type validation serve as the enforcement layer. This tradeoff is accepted.
- The signed URL is scoped to a specific path generated by the server, so the client cannot upload to an arbitrary path even if it intercepts the URL.

---

## ADR-004: CDN delivery URLs computed at render time from stored path and preset

**Status:** Accepted

**Context**

When a media item is finalized, one option is to compute and persist the CDN delivery URL (e.g., an `imagekit_url` column) in the database. This simplifies reads — the stored URL is fetched and used directly.

The alternative is to store only the canonical storage path and bucket identifier, then compute the delivery URL at render time by combining these with a named preset (`masonry_grid`, `lightbox_full`, `admin_thumb`, `original`).

**Decision**

Store `file_path` and `bucket_id` on `media_items`. At render time, pass these to a builder function that constructs the ImageKit URL with the appropriate transform parameters for the requested preset. An `imagekit_url` column exists in the schema from an earlier design iteration but is intentionally not populated.

**Consequences**

- Changing a CDN transform — say, widening masonry thumbnails from 400px to 600px — requires changing one line in the preset definition and redeploying. No data migration.
- Delivery URL construction is a code concern, not a data concern. The database holds durable storage facts (path, bucket, dimensions, EXIF); the CDN configuration is separately deployable.
- If the ImageKit endpoint changes (e.g., a project or account migration), all delivery URLs update on the next deploy with no backfill.
- URL construction is a string concatenation, not a database query or network call — compute cost is negligible.

---

## ADR-005: HEIC/HEIF preview via temporary ImageKit upload before permanent storage completes

**Status:** Accepted

**Context**

HEIC and HEIF are the native photo formats for Apple devices, the source of most guest uploads. Browsers do not support native HEIC preview — `URL.createObjectURL` on a HEIC file produces a broken image in Chrome and Firefox.

Options considered:

1. Transcode HEIC to JPEG server-side before storage, storing only the converted file. This loses the original and adds server-side processing latency.
2. Show a static placeholder while the full upload proceeds — poor UX, especially for a photo-sharing platform where preview is table-stakes.
3. Use a temporary ImageKit upload to get an immediate preview URL, then proceed with the permanent Supabase upload in parallel.

**Decision**

For HEIC/HEIF files only:

1. Client requests ImageKit upload auth params from `GET /api/imagekit-auth`.
2. Client uploads the file to ImageKit's Media Library under a `temp-previews/` path prefix.
3. ImageKit returns an immediately usable preview URL (converted on-the-fly to WebP/JPEG).
4. The permanent Supabase upload proceeds in the background.
5. After finalization, the client fires `POST /api/media/cleanup-preview` asynchronously. The cleanup endpoint validates that the file path begins with `temp-previews/` before making any delete call.

**Consequences**

- Guests see an immediate HEIC preview with no placeholder and no waiting.
- Original HEIC files are stored in Supabase, not a converted copy — full-resolution originals are preserved.
- The cleanup step is asynchronous and non-fatal. If it fails, a small temporary file accumulates in ImageKit's Media Library. The path-prefix validation in the cleanup endpoint prevents it from being used to delete arbitrary assets.
- This is the only point in the upload flow where files touch ImageKit's DAM storage — and they're deleted shortly after, keeping ImageKit DAM usage well within the free tier.
- JPEG and other natively previewable formats use `URL.createObjectURL` and never involve ImageKit at the preview stage.
