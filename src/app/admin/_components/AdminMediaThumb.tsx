'use client';

import { Image } from '@/lib/imagekit/imagekit-client';
import { is_imagekit_delivery_url } from '@/lib/media/media_delivery_policy';

type AdminMediaThumbProps = {
	media_url: string;
	alt: string;
	className?: string;
	width?: number;
	height?: number;
};

export function AdminMediaThumb({
	media_url,
	alt,
	className,
	width = 320,
	height = 240,
}: AdminMediaThumbProps) {
	if (is_imagekit_delivery_url(media_url)) {
		return (
			<Image src={media_url} alt={alt} width={width} height={height} className={className} />
		);
	}

	return (
		// eslint-disable-next-line @next/next/no-img-element -- local Supabase fallback (D9) or signed URL (#17)
		<img src={media_url} alt={alt} className={className} loading="lazy" decoding="async" />
	);
}
