'use client';

import { useMemo, useState } from 'react';

import { AdminMediaThumb } from '@/app/admin/_components/AdminMediaThumb';
import { build_media_delivery_url } from '@/lib/media/build_media_delivery_url';
import { createClient } from '@/lib/supabase/client';
import { TrashIcon } from '@/ui/Icon/icons/TrashIcon';

import type { GalleryDetailMediaItem, GalleryMediaJoinRow } from './gallery_detail_media.types';
import styles from '../gallery-detail.module.css';

/** Optimistic add rows use this prefix until the insert returns a real `gallery_media_items.id`. */
export const PENDING_JOIN_ROW_PREFIX = '__pending__:';

export function is_pending_join_row_id(join_row_id: string): boolean {
	return join_row_id.startsWith(PENDING_JOIN_ROW_PREFIX);
}

export type GalleryMediaGridRow = {
	join_row_id: string;
	media_item_id: string;
	item: GalleryDetailMediaItem;
	/** Populated by Feature #17 for private `media-items` thumbnails. */
	signed_thumbnail_src?: string;
};

export type GalleryMediaGridProps = {
	rows: Array<GalleryMediaGridRow>;
	set_rows: React.Dispatch<React.SetStateAction<Array<GalleryMediaGridRow>>>;
	/** True while the add panel is mutating — disables remove to avoid overlapping optimistic updates. */
	is_locked_by_add_panel?: boolean;
	on_grid_mutation_start?: () => void;
	on_grid_mutation_end?: () => void;
};

export function join_rows_to_grid_rows(
	rows: Array<GalleryMediaJoinRow>
): Array<GalleryMediaGridRow> {
	const out: Array<GalleryMediaGridRow> = [];
	for (const row of rows) {
		if (!row.media_items) continue;
		out.push({
			join_row_id: row.id,
			media_item_id: row.media_item_id,
			item: row.media_items,
		});
	}
	return out;
}

export function GalleryMediaGrid({
	rows,
	set_rows,
	is_locked_by_add_panel = false,
	on_grid_mutation_start,
	on_grid_mutation_end,
}: GalleryMediaGridProps): React.JSX.Element {
	const supabase = useMemo(() => createClient(), []);
	const [is_busy, set_is_busy] = useState(false);
	const [error_text, set_error_text] = useState<string | null>(null);

	async function handle_remove(row: GalleryMediaGridRow) {
		if (is_pending_join_row_id(row.join_row_id)) {
			return;
		}
		set_error_text(null);
		const snapshot = [...rows];
		on_grid_mutation_start?.();
		set_is_busy(true);
		try {
			set_rows((prev) => prev.filter((r) => r.join_row_id !== row.join_row_id));

			const { error } = await supabase.from('gallery_media_items').delete().eq('id', row.join_row_id);

			if (error) {
				set_rows(snapshot);
				set_error_text(error.message ?? 'Could not remove this item from the gallery.');
			}
		} finally {
			set_is_busy(false);
			on_grid_mutation_end?.();
		}
	}

	if (rows.length === 0) {
		return <p className={styles.empty}>No media in this gallery yet.</p>;
	}

	return (
		<>
			{error_text ? (
				<p className={styles.errorBanner} role="alert">
					{error_text}
				</p>
			) : null}
			<div className={styles.masonry}>
				{rows.map((row) => {
					const { item } = row;
					const is_image =
						item.media_type === 'photo' || item.mime_type?.startsWith('image/');
					const is_pending_row = is_pending_join_row_id(row.join_row_id);
					const alt = item.title || item.original_filename;

					return (
						<div key={row.join_row_id} className={styles.mediaCard}>
							<div className={styles.mediaFrame}>
								{is_image ? (
									item.bucket_id === 'media-items' ? (
										row.signed_thumbnail_src ? (
											<AdminMediaThumb
												media_url={row.signed_thumbnail_src}
												alt={alt}
												className={styles.mediaThumb}
											/>
										) : (
											<div className={styles.mediaThumbPlaceholder}>Private media</div>
										)
									) : (
										<AdminMediaThumb
											media_url={build_media_delivery_url({
												file_path: item.file_path,
												bucket_id: 'app-media-items',
												preset: 'admin_thumb',
											})}
											alt={alt}
											className={styles.mediaThumb}
										/>
									)
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
								{is_pending_row ? (
									<p className={styles.pendingRowHint}>Saving to gallery…</p>
								) : (
									<button
										type="button"
										className={`${styles.actionButton} ${styles.removeButton}`}
										disabled={is_busy || is_locked_by_add_panel}
										aria-label={`Remove ${item.title || item.original_filename} from gallery`}
										onClick={() => void handle_remove(row)}
									>
										<TrashIcon size={16} color="currentColor" />
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
