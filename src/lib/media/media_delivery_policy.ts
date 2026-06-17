import type { MediaDeliveryBucketId } from './media_delivery_presets';

/** D1/D2: `app-media-items` is unsigned public CDN; `media-items` requires signed URLs. */
export function media_delivery_requires_signing(bucket_id: MediaDeliveryBucketId | string): boolean {
	return bucket_id === 'media-items';
}

/**
 * Whether display URLs should use ImageKit CDN vs direct Supabase public URLs.
 *
 * D9: ImageKit `/LandN` origins read **hosted** Supabase only. When the app points at
 * local Supabase (`localhost` / `127.0.0.1`), ImageKit fetches paths that exist only
 * locally → HTTP 404. Fall back to Supabase public URLs for local dev display.
 *
 * Set `NEXT_PUBLIC_IMAGEKIT_FORCE_CDN=true` to test ImageKit URLs against hosted storage
 * while the app still uses a local DB (paths must exist on hosted `app-media-items`).
 */
export function media_delivery_use_imagekit_cdn(): boolean {
	if (process.env.NEXT_PUBLIC_IMAGEKIT_FORCE_CDN === 'true') {
		return true;
	}

	const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
	const is_local_supabase =
		supabase_url.includes('localhost') || supabase_url.includes('127.0.0.1');

	return !is_local_supabase;
}

/** True when `url` targets ImageKit delivery (vs Supabase public object URL). */
export function is_imagekit_delivery_url(url: string): boolean {
	return url.includes('ik.imagekit.io');
}
