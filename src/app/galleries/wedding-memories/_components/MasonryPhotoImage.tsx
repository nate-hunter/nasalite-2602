'use client';

import { Image } from '@/lib/imagekit/imagekit-client';

import { is_imagekit_delivery_url } from '@/lib/media/media_delivery_policy';

import styles from '../wedding-memories.module.css';

import type { WeddingMemoriesMediaItem } from './wedding-memories.types';

/** ~2 columns below 64rem, ~5 columns at desktop; used by ImageKit `Image` for responsive srcset. */
export const MASONRY_IMAGE_SIZES = '(max-width: 63.99rem) 48vw, 19vw';

type MasonryPhotoImageProps = {
	item: WeddingMemoriesMediaItem;
	media_url: string;
};

export function MasonryPhotoImage({ item, media_url }: MasonryPhotoImageProps) {
	const alt = item.title || item.original_filename;
	const w = item.width;
	const h = item.height;
	const use_imagekit_image = is_imagekit_delivery_url(media_url);

	if (
		use_imagekit_image &&
		typeof w === 'number' &&
		w > 0 &&
		typeof h === 'number' &&
		h > 0
	) {
		return (
			<Image
				src={media_url}
				alt={alt}
				width={w}
				height={h}
				sizes={MASONRY_IMAGE_SIZES}
				className={styles.masonryImage}
			/>
		);
	}

	// Native img for local Supabase fallback (BUG-003 / D9) or when DB has no dimensions.
	return (
		// eslint-disable-next-line @next/next/no-img-element -- local fallback + missing dimensions
		<img src={media_url} alt={alt} className={styles.masonryImage} loading="lazy" decoding="async" />
	);
}
