/**
 * Cover-resolution helpers for gallery card display.
 *
 * GalleryCard shows a cover image in priority order:
 *   1. Explicit galleries.cover_image_id FK (set manually)
 *   2. Earliest photo in gallery_media_items (computed at query time — D2 decision)
 *   3. null → gray placeholder
 *
 * No writes to cover_image_id — this is query-time fallback only.
 */

export type GalleryCardCover = {
	file_path: string;
	bucket_id: string;
} | null;

export type GalleryDefaultCoverJoinRow = {
	gallery_id: string;
	added_at: string | null;
	media_items: {
		file_path: string;
		bucket_id: string;
		media_type: string;
	} | null;
};

/**
 * Reduce a flat, added_at-ascending list of gallery_media_items join rows
 * to a map of gallery_id → earliest photo cover.
 *
 * Rows must be pre-ordered by added_at ASC (from the DB query).
 * Photo filtering is done here in JS for reliability (PostgREST nested filters
 * on generated columns can be unreliable across client versions).
 */
export function pick_earliest_default_cover_by_gallery_id(
	rows: Array<GalleryDefaultCoverJoinRow>
): Map<string, NonNullable<GalleryCardCover>> {
	const map = new Map<string, NonNullable<GalleryCardCover>>();
	for (const row of rows) {
		if (map.has(row.gallery_id)) continue; // earliest already recorded
		const item = row.media_items;
		if (!item || item.media_type !== 'photo') continue; // skip videos / other
		map.set(row.gallery_id, {
			file_path: item.file_path,
			bucket_id: item.bucket_id,
		});
	}
	return map;
}

/**
 * Resolve the final cover for a gallery card:
 * - Explicit cover (from cover_image_id FK) wins if present.
 * - Falls back to the computed default cover from gallery media.
 * - Returns null (→ placeholder) if neither exists.
 */
export function resolve_gallery_card_cover(
	explicit_cover: GalleryCardCover,
	default_cover: NonNullable<GalleryCardCover> | undefined
): GalleryCardCover {
	if (explicit_cover) return explicit_cover;
	return default_cover ?? null;
}
