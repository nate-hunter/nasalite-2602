'use client';

import React from 'react';
import { Button } from '@/ui/Button/Button';
// import styles from './GallerySelector.module.css';
import styles from './GallerySelector.module.css';

export type GalleryOption = {
	id: string;
	title: string;
};

export type GallerySelectorProps = {
	galleries: Array<GalleryOption>;
	galleries_loading: boolean;
	selected_gallery_id: string | null;
	on_change: (id: string | null) => void;
	/**
	 * When true, the "None" option is hidden and the placeholder is non-selectable,
	 * forcing the user to choose a gallery before uploading.
	 * Defaults to false (user upload flow where gallery is optional).
	 */
	required?: boolean;
	/**
	 * When provided and the gallery list is empty, renders a "+ Create a gallery" button
	 * that calls this handler (user upload flow only).
	 * When absent and the list is empty, renders a static instructional message instead.
	 */
	on_switch_to_create_gallery?: () => void;
};

const NONE_SENTINEL = '__none__';

export function GallerySelector({
	galleries,
	galleries_loading,
	selected_gallery_id,
	on_change,
	required = false,
	on_switch_to_create_gallery,
}: GallerySelectorProps) {
	function handle_change(e: React.ChangeEvent<HTMLSelectElement>) {
		const val = e.target.value;
		on_change(val === NONE_SENTINEL ? null : val);
	}

	if (galleries_loading) {
		return (
			<select className={styles.select} disabled aria-label="Save to a gallery">
				<option value="">Loading galleries…</option>
			</select>
		);
	}

	if (galleries.length === 0) {
		if (on_switch_to_create_gallery) {
			return (
				<Button
					variant="ghost"
					onClick={on_switch_to_create_gallery}
					className={styles.createButton}
				>
					+ Create a gallery
				</Button>
			);
		}
		return (
			<p className={styles.emptyMessage}>
				No app galleries found. Create one in the Galleries tab.
			</p>
		);
	}

	return (
		<select
			className={styles.select}
			value={selected_gallery_id ?? ''}
			onChange={handle_change}
			aria-label="Save to a gallery"
		>
			<option value="" disabled>
				{required ? 'Select a gallery…' : 'Save to a gallery…'}
			</option>
			{!required && <option value={NONE_SENTINEL}>None</option>}
			{galleries.map((g) => (
				<option key={g.id} value={g.id}>
					{g.title}
				</option>
			))}
		</select>
	);
}
