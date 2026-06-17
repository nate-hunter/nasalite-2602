'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import shared from '@/app/admin/admin-shared.module.css';

import { AddMediaToGallery } from './AddMediaToGallery';
import type { GalleryDetailMediaItem, GalleryMediaJoinRow } from './gallery_detail_media.types';
import {
	GalleryMediaGrid,
	join_rows_to_grid_rows,
	type GalleryMediaGridRow,
} from './GalleryMediaGrid';
import styles from '../gallery-detail.module.css';

export type { GalleryDetailMediaItem, GalleryMediaJoinRow } from './gallery_detail_media.types';

export type GalleryMediaManagerProps = {
	gallery_id: string;
	gallery_media_rows: Array<GalleryMediaJoinRow>;
	all_media_items: Array<GalleryDetailMediaItem>;
};

/**
 * Shared client boundary for gallery membership UI.
 *
 * Invariants:
 * - `grid_rows` is the single source of truth for which media items are in the gallery.
 * - `gallery_item_ids` is derived from `grid_rows` only (never a separate Set state).
 * - `is_grid_mutating` / `is_add_mutating` coordinate so one panel cannot start a mutation
 *   while the other holds the lock (avoids races with optimistic rows).
 */
export default function GalleryMediaManager({
	gallery_id,
	gallery_media_rows,
	all_media_items,
}: GalleryMediaManagerProps): React.JSX.Element {
	const [grid_rows, set_grid_rows] = useState<Array<GalleryMediaGridRow>>(() =>
		join_rows_to_grid_rows(gallery_media_rows)
	);

	const [is_grid_mutating, set_is_grid_mutating] = useState(false);
	const [is_add_mutating, set_is_add_mutating] = useState(false);

	const apply_grid_rows_update = useCallback(
		(update: React.SetStateAction<Array<GalleryMediaGridRow>>) => {
			set_grid_rows(update);
		},
		[]
	);

	useEffect(() => {
		set_grid_rows(join_rows_to_grid_rows(gallery_media_rows));
		// Intentionally only `gallery_id`: reset when switching galleries. Join rows for this id
		// come from the same server render as `gallery_id`; do not reset on array reference churn.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- see above
	}, [gallery_id]);

	const on_grid_mutation_start = useCallback(() => {
		set_is_grid_mutating(true);
	}, []);

	const on_grid_mutation_end = useCallback(() => {
		set_is_grid_mutating(false);
	}, []);

	const on_add_mutation_start = useCallback(() => {
		set_is_add_mutating(true);
	}, []);

	const on_add_mutation_end = useCallback(() => {
		set_is_add_mutating(false);
	}, []);

	const gallery_item_ids = useMemo(
		() => new Set(grid_rows.map((r) => r.media_item_id)),
		[grid_rows]
	);

	return (
		<>
			<section className={styles.section} aria-labelledby="gallery-detail-in-heading">
				<h3 id="gallery-detail-in-heading" className={shared.sectionTitle}>
					Media in this gallery
				</h3>
				<p className={styles.hint}>
					Removing an item only unlinks it from this gallery; the file stays in app media and shows
					in the section below.
				</p>
				<GalleryMediaGrid
					rows={grid_rows}
					set_rows={apply_grid_rows_update}
					is_locked_by_add_panel={is_add_mutating}
					on_grid_mutation_start={on_grid_mutation_start}
					on_grid_mutation_end={on_grid_mutation_end}
				/>
			</section>

			<section className={styles.section} aria-labelledby="gallery-detail-available-heading">
				<h3 id="gallery-detail-available-heading" className={shared.sectionTitle}>
					App media not in this gallery
				</h3>
				<AddMediaToGallery
					gallery_id={gallery_id}
					all_media_items={all_media_items}
					gallery_item_ids={gallery_item_ids}
					apply_grid_rows_update={apply_grid_rows_update}
					is_locked_by_grid_panel={is_grid_mutating}
					on_add_mutation_start={on_add_mutation_start}
					on_add_mutation_end={on_add_mutation_end}
				/>
			</section>
		</>
	);
}
