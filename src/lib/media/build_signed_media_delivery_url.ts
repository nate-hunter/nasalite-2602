import 'server-only';

import { imagekit } from '@/lib/imagekit/imagekit-server';

import type { MediaDeliveryBucketId, MediaDeliveryPreset } from './media_delivery_presets';
import { MEDIA_DELIVERY_PRESET_TRANSFORMS } from './media_delivery_presets';
import { media_delivery_requires_signing } from './media_delivery_policy';

const DEFAULT_EXPIRE_SECONDS = 3600;

export type BuildSignedMediaDeliveryUrlParams = {
	file_path: string;
	bucket_id: MediaDeliveryBucketId;
	preset?: MediaDeliveryPreset;
	expires_in_sec?: number;
};

function normalize_file_path(file_path: string): string {
	return file_path.replace(/^\/+/, '');
}

function preset_to_sdk_transformation(preset: MediaDeliveryPreset) {
	return MEDIA_DELIVERY_PRESET_TRANSFORMS[preset].map((transform) => {
		const entry: Record<string, string | number | boolean> = {};
		if (transform.width !== undefined) entry.width = transform.width;
		if (transform.height !== undefined) entry.height = transform.height;
		if (transform.format !== undefined) entry.format = transform.format;
		if (transform.quality !== undefined) entry.quality = transform.quality;
		return entry;
	});
}

/**
 * Server-only signed ImageKit URL for private `media-items` (D2). Feature #17 will wire this
 * into admin/guest display; do not import from client components.
 */
export function build_signed_media_delivery_url({
	file_path,
	bucket_id,
	preset = 'masonry_grid',
	expires_in_sec = DEFAULT_EXPIRE_SECONDS,
}: BuildSignedMediaDeliveryUrlParams): string {
	if (!media_delivery_requires_signing(bucket_id)) {
		throw new Error(
			`build_signed_media_delivery_url is for signed media-items only; use build_media_delivery_url for ${bucket_id}`
		);
	}

	const path = normalize_file_path(file_path);
	const transformation = preset_to_sdk_transformation(preset);

	return imagekit.url({
		path: `/${path}`,
		signed: true,
		expireSeconds: expires_in_sec,
		transformation: transformation.length > 0 ? transformation : undefined,
		transformationPosition: 'query',
	});
}
