import { createClient } from '@/lib/supabase/server';
import CreateGalleryForm from '@/app/admin/galleries/_components/CreateGalleryForm';
import GalleryList from '@/app/admin/galleries/_components/GalleryList';
import {
	pick_earliest_default_cover_by_gallery_id,
	resolve_gallery_card_cover,
	type GalleryCardCover,
	type GalleryDefaultCoverJoinRow,
} from '@/lib/galleries/resolve_gallery_card_cover';
import shared from '@/app/admin/admin-shared.module.css';
import styles from './galleries-page.module.css';

export default async function AdminGalleriesPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return null;

	// Join cover image directly via the galleries.cover_image_id FK.
	const { data: galleries } = await supabase
		.from('galleries')
		.select(
			'id, slug, title, description, is_public, created_at, cover_image:media_items!cover_image_id(file_path, bucket_id)'
		)
		.eq('creator_id', user.id)
		.order('created_at', { ascending: false });

	const galleryIds = (galleries ?? []).map((g) => g.id);

	// Fetch default cover rows: earliest photo per gallery when cover_image_id is null.
	// Filtering to photos is done in JS (see pick_earliest_default_cover_by_gallery_id)
	// to avoid unreliable PostgREST nested-column filtering on generated columns.
	const { data: defaultCoverRows } =
		galleryIds.length > 0
			? await supabase
					.from('gallery_media_items')
					.select(
						'gallery_id, added_at, media_items(file_path, bucket_id, media_type)'
					)
					.in('gallery_id', galleryIds)
					.order('added_at', { ascending: true })
			: { data: [] as Array<GalleryDefaultCoverJoinRow> };

	const defaultCoverByGalleryId = pick_earliest_default_cover_by_gallery_id(
		(defaultCoverRows ?? []) as Array<GalleryDefaultCoverJoinRow>
	);

	// Merge explicit cover_image_id FK (wins) with computed default per gallery.
	const galleriesWithCover = (galleries ?? []).map((gallery) => ({
		...gallery,
		cover_image: resolve_gallery_card_cover(
			gallery.cover_image as GalleryCardCover,
			defaultCoverByGalleryId.get(gallery.id)
		),
	}));

	// Fetch assignment summaries: only need gallery_id + is_active for badge + count.
	const { data: assignments } =
		galleryIds.length > 0
			? await supabase
					.from('gallery_page_assignments')
					.select('gallery_id, is_active')
					.in('gallery_id', galleryIds)
			: { data: [] as { gallery_id: string; is_active: boolean }[] };

	// Build per-gallery summary: total count and whether any row is active.
	const assignmentSummaryByGalleryId: Record<string, { count: number; hasActive: boolean }> = {};
	for (const row of assignments ?? []) {
		const existing = assignmentSummaryByGalleryId[row.gallery_id] ?? { count: 0, hasActive: false };
		assignmentSummaryByGalleryId[row.gallery_id] = {
			count: existing.count + 1,
			hasActive: existing.hasActive || row.is_active,
		};
	}

	return (
		<>
			<section className={styles.section}>
				<h2 className={shared.sectionTitle}>Create gallery</h2>
				<CreateGalleryForm />
			</section>
			<section className={styles.section}>
				<h2 className={shared.sectionTitle}>Your galleries</h2>
				<GalleryList
					galleries={galleriesWithCover}
					assignmentSummaryByGalleryId={assignmentSummaryByGalleryId}
				/>
			</section>
		</>
	);
}
