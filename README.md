# Lisa + Nate Memories

**A full-stack media platform for a Lisa + Nate's Memories** — authenticated users upload photos and videos; admins curate public galleries; scheduled assignments control what appears on the public site.

Built solo as a portfolio-grade project demonstrating end-to-end product engineering: Next.js App Router, TypeScript, Supabase (Postgres + Auth + Storage + RLS), and production-minded upload pipelines.

| | |
|---|---|
| **Stack** | Next.js 16 · React 19 · TypeScript · Supabase · ImageKit |
| **Scope** | Auth, guest uploads, admin CMS, public gallery surfaces, API routes, declarative Postgres schema + migrations |
| **Role** | Sole designer and implementer |
| **Live demo** | *[Add URL when deployed]* |
| **Portfolio** | *[Add portfolio / case-study link]* |

---

## What this project demonstrates

- **Full-stack ownership** — From database schema and RLS policies through UI, API routes, and client upload flows.
- **Real-world media constraints** — Large files (videos up to 5 GiB), HEIC/HEIF, EXIF/GPS metadata, and browser preview limitations handled explicitly.
- **Secure multi-tenant storage** — Two Supabase buckets with path conventions and row-level security; role-gated admin writes (`super_admin`).
- **Curated public surfaces** — Galleries are not “everything public”; visibility is driven by `gallery_page_assignments` (page slug, display order, active windows).
- **Modern React architecture** — Server Components for data fetching, client components only where interaction requires it, typed Supabase client generated from schema.

---

## Technical highlights

### Upload pipeline (guest & admin)

Direct-to-storage uploads keep heavy binaries off the app server:

1. Authenticated client requests a **signed upload URL** (`POST /api/media/request-upload-url`).
2. File uploads **directly to Supabase Storage** (per-user paths for guests; flat dated paths for admin media).
3. Client calls **`POST /api/media/finalize-upload`** to create the `media_items` row, parse EXIF (`exifr`), reverse-geocode GPS when present, and link assets to galleries.

**Videos** use the **TUS resumable protocol** (`tus-js-client`, 6 MiB chunks, retry backoff) so mobile uploads can survive dropped connections.

**HEIC/HEIF** previews route through **ImageKit** temp uploads when the browser cannot decode natively.

### Public wedding gallery

The `/galleries/wedding-memories` surface loads curated vendor galleries via `GET /api/galleries/wedding-memories`, which joins:

- `gallery_page_assignments` (active slug, schedule, sort order)
- `galleries` (public only)
- `gallery_media_items` → `media_items` (public app-media bucket)

Anonymous read access is enforced in **Postgres RLS**, not only in application code.

### Admin console

`/admin` is restricted to users with `user_profiles.app_role = 'super_admin'`. Admins create galleries, upload app-owned media, assign galleries to public page slugs, and manage display order and visibility windows.

---

## Architecture (high level)

```text
┌─────────────┐     signed URL      ┌──────────────────┐
│   Browser   │ ──────────────────► │ Supabase Storage │
│  (upload)   │                     │ media-items /    │
└──────┬──────┘                     │ app-media-items  │
       │ finalize + metadata        └────────┬─────────┘
       ▼                                    │
┌─────────────┐     RLS + joins      ┌──────▼─────────┐
│  Next.js    │ ◄──────────────────► │ Postgres       │
│  API + RSC  │                      │ galleries,     │
└─────────────┘                      │ media_items,   │
                                     │ assignments    │
                                     └────────────────┘
```

**Two storage buckets, two trust models**

| Bucket | Audience | Access model |
|--------|----------|----------------|
| `media-items` | Guest uploads | Private; path includes `users/{user_id}/…` |
| `app-media-items` | Admin-curated public media | Public read; writes gated to `super_admin` |

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, CSS Modules, design tokens, self-hosted variable fonts |
| **Backend / data** | Supabase (Postgres, Auth, Storage), declarative schema + versioned migrations, generated TypeScript types |
| **Media** | ImageKit (HEIC previews, SDK), `exifr`, `tus-js-client`, `react-player` |
| **Auth** | Supabase magic-link (passwordless), SSR cookie session via `@supabase/ssr` |

---

## Key routes

| Path | Access | Purpose |
|------|--------|---------|
| `/` | Public | Landing → wedding memories |
| `/galleries/wedding-memories` | Public | Curated photo galleries + vendor films |
| `/media/upload` | Authenticated | Guest upload flow |
| `/login` | Public | Magic-link sign-in |
| `/admin`, `/admin/galleries`, `/admin/media` | `super_admin` | Curation and page assignments |

---

## Repository layout

```text
src/app/           App Router pages (public, auth, admin, API routes)
src/lib/supabase/  SSR client, generated types, TUS upload helper
src/ui/            Shared UI components
supabase/schemas/  Declarative Postgres schema
supabase/migrations/  Applied migrations (tables, RLS, storage buckets)
```

---

## Running locally (technical reviewers)

Requires **Node 20+**, **Docker**, and the **[Supabase CLI](https://supabase.com/docs/guides/cli)**.

```bash
supabase start
npm install
npm run gen:types   # requires local Supabase
npm run dev         # http://localhost:3000
```

**Environment variables** (`.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=              # server-only

NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=

# Optional in dev: GPS → place name on finalize
NEXT_PUBLIC_ENABLE_REVERSE_GEOCODING=true

# Local dev: bypass next/image optimizer (Supabase on localhost is a private IP)
NEXT_PUBLIC_IMAGE_UNOPTIMIZED=true
```

**Scripts:** `dev` · `build` · `start` · `lint` · `gen:types` (regenerate `src/lib/supabase/database.types.ts` from local DB) · `verify:imagekit-landn` (hosted ImageKit CDN smoke test)

Local Supabase API defaults to port **54321** (see `supabase/config.toml`). `next.config.ts` allows local and remote Supabase storage hosts for `next/image`.

### ImageKit CDN (`/LandN`)

Gallery CDN delivery uses **hosted Supabase** as ImageKit’s S3 origin — not local storage or ngrok.

| Layer | Local dev | ImageKit origins (CDN verify / pre-launch) |
|-------|-----------|---------------------------------------------|
| App DB + uploads | `localhost:54321` (`.env.local`) | Hosted project **L+N** (`sxexcquvfdyfatfinxfw`) |
| ImageKit endpoint | `https://ik.imagekit.io/tig3rm4c/LandN` | Same |
| Origins | N/A locally | 2× S3-compatible → `https://{project_ref}.storage.supabase.co/storage/` |

**Dashboard (ImageKit):** two S3 origins (`app-media-items`, `media-items`), path-style on, attached to `/LandN` (Media Library optional). S3 keys from hosted Dashboard → Storage → S3 — not local CLI keys.

**Verify CDN** (requires a file on **hosted** `app-media-items`):

```bash
npm run verify:imagekit-landn
# Or: IMAGEKIT_TEST_FILE_PATH=2026/04/your-file.png npm run verify:imagekit-landn
```

Full setup and decisions: `__local/__docs/features/media-files-upload/260604--AGENT1--IMAGEKIT_CDN_PHASE0_PLATFORM_SETUP.md` (Feature #13).

---

## Author

**Nate Hunter** — *[LinkedIn](https://linkedin.com/in/…)* · *[Portfolio](https://…)*

Private personal project; source shared for interview and portfolio review.
