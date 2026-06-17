'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { build_media_delivery_url } from '@/lib/media/build_media_delivery_url';
import { CloseIcon, DownloadIcon, MaximizeIcon } from '@/ui/Icon';
import styles from '../wedding-memories.module.css';
import { MasonryPhotoImage } from './MasonryPhotoImage';
import type { WeddingMemoriesGallery, WeddingMemoriesMediaItem } from './wedding-memories.types';

const PAGE_SIZE = 24;

export type VendorGalleryTabsProps = {
	galleries: Array<WeddingMemoriesGallery>;
};

function sort_wedding_galleries(
	galleries: Array<WeddingMemoriesGallery>
): Array<WeddingMemoriesGallery> {
	return [...galleries].sort((a, b) => {
		if (a.display_order !== b.display_order) {
			return a.display_order - b.display_order;
		}
		return a.title.localeCompare(b.title);
	});
}

function get_default_gallery_id(galleries: Array<WeddingMemoriesGallery>): string {
	return sort_wedding_galleries(galleries)[0]?.id ?? '';
}

function filter_gallery_photos(gallery: WeddingMemoriesGallery): Array<WeddingMemoriesMediaItem> {
	return gallery.media_items.filter(
		(item) => item.media_type === 'photo' || item.mime_type.startsWith('image/')
	);
}

/**
 * Tabbed selection of a single public gallery; masonry for the active tab lives in the tabpanel.
 *
 * Remount when the gallery id set changes (`key` on the parent) so `active_gallery_id` is never
 * stale for removed ids — avoids `useEffect` + `setState`, which trips `react-hooks/set-state-in-effect`.
 */
export function VendorGalleryTabs({ galleries }: VendorGalleryTabsProps) {
	const baseid = useId();
	const tab_scroll_ref = useRef<HTMLDivElement>(null);
	const dialog_ref = useRef<HTMLDialogElement>(null);

	const [active_gallery_id, set_active_gallery_id] = useState<string>(() =>
		get_default_gallery_id(galleries)
	);
	const [page, set_page] = useState(0);
	const [modal_item, set_modal_item] = useState<WeddingMemoriesMediaItem | null>(null);
	const [downloading_id, set_downloading_id] = useState<string | null>(null);

	const sorted_galleries = useMemo(() => sort_wedding_galleries(galleries), [galleries]);

	// Open / close the native dialog in sync with modal_item.
	useEffect(() => {
		const dialog = dialog_ref.current;
		if (!dialog) return;
		if (modal_item) {
			dialog.showModal();
			document.body.style.overflow = 'hidden';
		} else {
			dialog.close();
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [modal_item]);

	// Sync state when the user presses Escape (native dialog cancel event).
	useEffect(() => {
		const dialog = dialog_ref.current;
		if (!dialog) return;
		function handle_cancel() {
			set_modal_item(null);
		}
		dialog.addEventListener('cancel', handle_cancel);
		return () => dialog.removeEventListener('cancel', handle_cancel);
	}, []);

	if (galleries.length === 0) {
		return null;
	}

	const active_gallery =
		sorted_galleries.find((g) => g.id === active_gallery_id) ?? sorted_galleries[0];

	const photos = filter_gallery_photos(active_gallery);
	const total_pages = Math.ceil(photos.length / PAGE_SIZE);
	const visible_photos = photos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

	function handle_gallery_tab_select(gallery_id: string) {
		set_active_gallery_id(gallery_id);
		set_page(0);
	}

	function scroll_to_tabs() {
		tab_scroll_ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function handle_prev() {
		set_page((p) => Math.max(0, p - 1));
		scroll_to_tabs();
	}

	function handle_next() {
		set_page((p) => Math.min(total_pages - 1, p + 1));
		scroll_to_tabs();
	}

	async function handle_download(item: WeddingMemoriesMediaItem) {
		if (downloading_id !== null) return;
		set_downloading_id(item.id);
		try {
			const params = new URLSearchParams({
				file_path: item.file_path,
				bucket_id: 'app-media-items',
				filename: item.original_filename,
			});
			const response = await fetch(`/api/media/download?${params}`);
			if (!response.ok) throw new Error(`Download failed: ${response.status}`);
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = item.original_filename;
			document.body.appendChild(anchor);
			anchor.click();
			document.body.removeChild(anchor);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('[download]', err);
		} finally {
			set_downloading_id(null);
		}
	}

	// Clicking the <dialog> element itself (the backdrop area) closes the lightbox.
	function handle_backdrop_click(e: React.MouseEvent<HTMLDialogElement>) {
		if (e.target === dialog_ref.current) {
			set_modal_item(null);
		}
	}

	return (
		<section className={styles.vendorSection} aria-labelledby={`${baseid}-photos-heading`}>
			<h2 id={`${baseid}-photos-heading`} className={styles.vendorSectionTitle}>
				Photos
			</h2>

			<div ref={tab_scroll_ref} className={styles.galleryTabScroll}>
				<div className={styles.galleryTabsRow} role="tablist" aria-label="Public photo galleries">
					{sorted_galleries.map((gallery) => {
						const tabid = `${baseid}-tab-${gallery.id}`;
						const panelid = `${baseid}-panel-${gallery.id}`;
						const is_selected = gallery.id === active_gallery.id;
						return (
							<button
								key={gallery.id}
								type="button"
								id={tabid}
								role="tab"
								aria-selected={is_selected}
								aria-controls={panelid}
								tabIndex={is_selected ? 0 : -1}
								className={is_selected ? styles.galleryTabActive : styles.galleryTab}
								onClick={() => handle_gallery_tab_select(gallery.id)}
							>
								{gallery.title}
							</button>
						);
					})}
				</div>
			</div>

			<div
				id={`${baseid}-panel-${active_gallery.id}`}
				role="tabpanel"
				aria-labelledby={`${baseid}-tab-${active_gallery.id}`}
				className={styles.galleryTabPanel}
			>
				{photos.length > 0 ? (
					<>
						<div className={styles.masonryGrid} role="list">
							{visible_photos.map((item) => {
								const media_url = build_media_delivery_url({
									file_path: item.file_path,
									bucket_id: 'app-media-items',
									preset: 'masonry_grid',
								});
								return (
									<article key={item.id} className={styles.masonryItem} role="listitem">
										<div className={styles.masonryImageWrap}>
											<MasonryPhotoImage item={item} media_url={media_url} />
										<div className={styles.masonryOverlay}>
											<button
												type="button"
												className={styles.masonryExpandBtn}
												onClick={() => handle_download(item)}
												disabled={downloading_id === item.id}
												aria-label={`Download ${item.title || item.original_filename}`}
											>
												<DownloadIcon size={18} />
											</button>
											<button
												type="button"
												className={styles.masonryExpandBtn}
												onClick={() => set_modal_item(item)}
												aria-label={`View ${item.title || item.original_filename} full size`}
											>
												<MaximizeIcon size={18} />
											</button>
										</div>
										</div>
									</article>
								);
							})}
						</div>

						{total_pages > 1 && (
							<div className={styles.paginationBar} aria-label="Photo pagination">
								<button
									type="button"
									className={styles.paginationBtn}
									onClick={handle_prev}
									disabled={page === 0}
									aria-label="Previous page"
								>
									← Prev
								</button>
								<p className={styles.paginationMeta}>
									{page + 1} / {total_pages}
								</p>
								<button
									type="button"
									className={styles.paginationBtn}
									onClick={handle_next}
									disabled={page === total_pages - 1}
									aria-label="Next page"
								>
									Next →
								</button>
							</div>
						)}
					</>
				) : (
					<p className={styles.galleryDescription}>No photos in this gallery yet.</p>
				)}
			</div>

			{/* eslint-disable-next-line @next/next/no-img-element -- full-res lightbox; next/image not suitable here */}
			<dialog
				ref={dialog_ref}
				className={styles.lightboxDialog}
				onClick={handle_backdrop_click}
				aria-label="Photo lightbox"
			>
				<div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
					{modal_item && (
						<>
							<div className={styles.lightboxActions}>
								<button
									type="button"
									className={styles.lightboxActionBtn}
									onClick={() => handle_download(modal_item)}
									disabled={downloading_id === modal_item.id}
									aria-label={`Download ${modal_item.title || modal_item.original_filename}`}
								>
									<DownloadIcon size={20} />
								</button>
								<button
									type="button"
									className={styles.lightboxActionBtn}
									onClick={() => set_modal_item(null)}
									aria-label="Close lightbox"
								>
									<CloseIcon size={20} />
								</button>
							</div>
							{/* eslint-disable-next-line @next/next/no-img-element -- D8: lightbox uses native img, not @imagekit/next Image */}
							<img
								src={build_media_delivery_url({
									file_path: modal_item.file_path,
									bucket_id: 'app-media-items',
									preset: 'lightbox_full',
								})}
								alt={modal_item.title || modal_item.original_filename}
								className={styles.lightboxImg}
							/>
						</>
					)}
				</div>
			</dialog>
		</section>
	);
}
