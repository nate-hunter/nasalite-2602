import type { Transformation } from '@imagekit/javascript';

/** Named transform presets for ImageKit delivery URLs (photos only — D5). */
export type MediaDeliveryPreset = 'masonry_grid' | 'lightbox_full' | 'original' | 'admin_thumb';

export type MediaDeliveryBucketId = 'app-media-items' | 'media-items';

/**
 * Preset → ImageKit transformation chain. Used by `build_media_delivery_url` and the
 * signed URL builder (Feature #17).
 *
 * Phase 0 verified: `w-400,f-auto` on hosted `app-media-items` via `/LandN`.
 */
export const MEDIA_DELIVERY_PRESET_TRANSFORMS: Record<
	MediaDeliveryPreset,
	Array<Transformation>
> = {
	masonry_grid: [{ width: 400, format: 'auto' }],
	lightbox_full: [{ width: 1920, format: 'auto' }],
	original: [],
	admin_thumb: [{ width: 320, format: 'auto' }],
};
