'use client';

import { useMemo, useState } from 'react';

import { AdminMediaThumb } from '@/app/admin/_components/AdminMediaThumb';
import { build_media_delivery_url } from '@/lib/media/build_media_delivery_url';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/supabase/database.types';

import type { GalleryDetailMediaItem } from './gallery_detail_media.types';
import { PENDING_JOIN_ROW_PREFIX, type GalleryMediaGridRow } from './GalleryMediaGrid';
import styles from '../gallery-detail.module.css';

export type AddMediaToGalleryProps = {
	gallery_id: string;
	all_media_items: Array<GalleryDetailMediaItem>;
	gallery_item_ids: ReadonlySet<string>;
	apply_grid_rows_update: React.Dispatch<React.SetStateAction<Array<GalleryMediaGridRow>>>;
	/** True while the in-gallery grid is mutating — disables add to avoid overlapping optimistic updates. */
	is_locked_by_grid_panel?: boolean;
	on_add_mutation_start?: () => void;
	on_add_mutation_end?: () => void;
};

export function AddMediaToGallery({
	gallery_id,
	all_media_items,
	gallery_item_ids,
	apply_grid_rows_update,
	is_locked_by_grid_panel = false,
	on_add_mutation_start,
	on_add_mutation_end,
}: AddMediaToGalleryProps): React.JSX.Element {
	const supabase = useMemo(() => createClient(), []);
	const [is_busy, set_is_busy] = useState(false);
	const [error_text, set_error_text] = useState<string | null>(null);

	const available_items = useMemo(
		() => all_media_items.filter((m) => !gallery_item_ids.has(m.id)),
		[all_media_items, gallery_item_ids]
	);

	async function handle_add(item: GalleryDetailMediaItem) {
		set_error_text(null);
		const pending_join_id = `${PENDING_JOIN_ROW_PREFIX}${item.id}`;
		const optimistic_row: GalleryMediaGridRow = {
			join_row_id: pending_join_id,
			media_item_id: item.id,
			item,
		};

		on_add_mutation_start?.();
		set_is_busy(true);
		try {
			apply_grid_rows_update((prev) => [...prev, optimistic_row]);

			const {
				data: { user },
			} = await supabase.auth.getUser();

			const insert: TablesInsert<'gallery_media_items'> = {
				gallery_id,
				media_item_id: item.id,
				added_by: user?.id ?? null,
			};

			const { data, error } = await supabase
				.from('gallery_media_items')
				.insert(insert)
				.select('id, media_item_id')
				.single();

			if (error || !data) {
				apply_grid_rows_update((prev) => prev.filter((r) => r.join_row_id !== pending_join_id));
				set_error_text(error?.message ?? 'Could not add this item to the gallery.');
				return;
			}

			apply_grid_rows_update((prev) =>
				prev.map((r) =>
					r.join_row_id === pending_join_id
						? {
								join_row_id: data.id,
								media_item_id: data.media_item_id,
								item,
							}
						: r
				)
			);
		} finally {
			set_is_busy(false);
			on_add_mutation_end?.();
		}
	}

	if (available_items.length === 0) {
		return <p className={styles.empty}>All app media is already in this gallery.</p>;
	}

	return (
		<>
			{error_text ? (
				<p className={styles.errorBanner} role="alert">
					{error_text}
				</p>
			) : null}
			<div className={styles.masonry}>
				{available_items.map((item) => {
					const is_image =
						item.media_type === 'photo' || item.mime_type?.startsWith('image/');
					const alt = item.title || item.original_filename;
					const media_url = build_media_delivery_url({
						file_path: item.file_path,
						bucket_id: 'app-media-items',
						preset: 'admin_thumb',
					});

					return (
						<div key={item.id} className={styles.mediaCard}>
							<div className={styles.mediaFrame}>
								{is_image ? (
									<AdminMediaThumb
										media_url={media_url}
										alt={alt}
										className={styles.mediaThumb}
									/>
								) : (
									<div className={styles.mediaThumbPlaceholder}>Video</div>
								)}
								<div className={styles.mediaMeta}>
									<span className={styles.mediaLabel}>
										{item.title || item.original_filename}
									</span>
									<span className={styles.mediaSub}>
										{item.media_type} · {new Date(item.created_at).toLocaleDateString()}
									</span>
								</div>
								<button
									type="button"
									className={`${styles.actionButton} ${styles.addButton}`}
									disabled={is_busy || is_locked_by_grid_panel}
									aria-label={`Add ${item.title || item.original_filename} to gallery`}
									onClick={() => void handle_add(item)}
								>
									Add to gallery
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
