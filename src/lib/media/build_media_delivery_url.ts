import type { Transformation } from '@imagekit/javascript';

import { imagekiturl, storage_public_object_url } from '@/lib/config';

import type { MediaDeliveryBucketId, MediaDeliveryPreset } from './media_delivery_presets';
import { MEDIA_DELIVERY_PRESET_TRANSFORMS } from './media_delivery_presets';
import { media_delivery_use_imagekit_cdn } from './media_delivery_policy';

export type BuildMediaDeliveryUrlParams = {
	/** Storage path relative to bucket root — no leading slash (e.g. `2026/04/foo.jpg`). */
	file_path: string;
	bucket_id: MediaDeliveryBucketId;
	preset?: MediaDeliveryPreset;
};

function normalize_file_path(file_path: string): string {
	return file_path.replace(/^\/+/, '');
}

/** ImageKit `tr` query value for `transformationPosition: 'query'` (matches verify-imagekit-landn). */
function transformations_to_tr_query(transformations: Array<Transformation>): string {
	const chains = transformations.map((transform) => {
		const parts: string[] = [];
		if (transform.width !== undefined) parts.push(`w-${transform.width}`);
		if (transform.height !== undefined) parts.push(`h-${transform.height}`);
		if (transform.format !== undefined) parts.push(`f-${transform.format}`);
		if (transform.quality !== undefined) parts.push(`q-${transform.quality}`);
		return parts.join(',');
	});
	return chains.join(':');
}

function build_imagekit_unsigned_url(path: string, preset: MediaDeliveryPreset): string {
	const endpoint = imagekiturl.replace(/\/$/, '');
	const base = `${endpoint}/${path}`;
	const transformation = MEDIA_DELIVERY_PRESET_TRANSFORMS[preset];
	if (transformation.length === 0) return base;
	return `${base}?tr=${transformations_to_tr_query(transformation)}`;
}

/**
 * Builds an **unsigned** ImageKit delivery URL at render time from `file_path` (D3 — no DB
 * `imagekit_url`). Intended for public `app-media-items` display (D1).
 *
 * D4: single `/LandN` endpoint; `bucket_id` is accepted for API clarity and signing policy (#17).
 */
export function build_media_delivery_url({
	file_path,
	bucket_id,
	preset = 'masonry_grid',
}: BuildMediaDeliveryUrlParams): string {
	const path = normalize_file_path(file_path);

	if (!media_delivery_use_imagekit_cdn()) {
		return storage_public_object_url(bucket_id, path);
	}

	return build_imagekit_unsigned_url(path, preset);
}
