'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GalleryOption } from './GallerySelector';

type UseGalleriesOptions = {
	/**
	 * true  → fetch galleries where is_app_gallery = true  (admin upload form)
	 * false → fetch galleries where is_app_gallery = false, filtered to the current user
	 *         and excluding the default uploads gallery (user upload form)
	 */
	filter_app_galleries: boolean;
};

type UseGalleriesReturn = {
	galleries: Array<GalleryOption>;
	galleries_loading: boolean;
};

export function use_galleries({ filter_app_galleries }: UseGalleriesOptions): UseGalleriesReturn {
	const [galleries, set_galleries] = useState<Array<GalleryOption>>([]);
	const [galleries_loading, set_galleries_loading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			set_galleries_loading(true);
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user || cancelled) {
				set_galleries_loading(false);
				return;
			}

			const base_query = supabase
				.from('galleries')
				.select('id, title')
				.eq('is_app_gallery', filter_app_galleries);

			// User galleries: exclude the default uploads gallery and scope to the current user.
			// App galleries: no creator filter — app galleries are shared admin resources.
			const filtered_query = filter_app_galleries
				? base_query
				: base_query.eq('is_default', false).eq('creator_id', user.id);

			const { data } = await filtered_query.order('created_at', { ascending: true });
			if (!cancelled) {
				set_galleries(data ?? []);
				set_galleries_loading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [filter_app_galleries]);

	return { galleries, galleries_loading };
}
