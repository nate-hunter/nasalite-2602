import { buildSrc } from '@imagekit/next';

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

	const transformation = MEDIA_DELIVERY_PRESET_TRANSFORMS[preset];

	return buildSrc({
		urlEndpoint: imagekiturl,
		src: path,
		transformation: transformation.length > 0 ? transformation : undefined,
		transformationPosition: 'query',
	});
}
