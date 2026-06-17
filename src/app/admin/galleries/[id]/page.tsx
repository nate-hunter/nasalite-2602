import Link from 'next/link';
import { notFound } from 'next/navigation';

import ManageGalleryAssignments from '@/app/admin/galleries/_components/ManageGalleryAssignments';
import EditGalleryPublicState from '@/app/admin/galleries/[id]/_components/EditGalleryPublicState';
import EditGallerySlug from '@/app/admin/galleries/[id]/_components/EditGallerySlug';
import GalleryMediaManager from '@/app/admin/galleries/[id]/_components/GalleryMediaManager';
import { createClient } from '@/lib/supabase/server';

import shared from '@/app/admin/admin-shared.module.css';
import styles from './gallery-detail.module.css';

export default async function AdminGalleryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await createClient();

	const { data: gallery, error: gallery_error } = await supabase
		.from('galleries')
		.select('id, title, description, slug, is_public, created_at')
		.eq('id', id)
		.single();

	if (gallery_error || !gallery) {
		notFound();
	}

	const { data: gallery_media_rows } = await supabase
		.from('gallery_media_items')
		.select(
			'id, media_item_id, added_at, media_items(id, title, original_filename, file_path, mime_type, media_type, bucket_id, created_at)'
		)
		.eq('gallery_id', id);

	const { data: all_media_items } = await supabase
		.from('media_items')
		.select('id, title, original_filename, file_path, mime_type, media_type, bucket_id, created_at')
		.eq('bucket_id', 'app-media-items')
		.order('created_at', { ascending: false });

	const { data: page_assignments } = await supabase
		.from('gallery_page_assignments')
		.select('*')
		.eq('gallery_id', id)
		.order('display_order', { ascending: true });

	return (
		<div className={styles.page}>
			<Link href="/admin/galleries" className={styles.backLink}>
				← Back to galleries
			</Link>

			<header className={styles.galleryHeader}>
				<h2 className={styles.galleryTitle}>{gallery.title}</h2>
				{gallery.description ? (
					<p className={styles.galleryDescription}>{gallery.description}</p>
				) : null}
				<p className={styles.galleryMeta}>
					Created {new Date(gallery.created_at).toLocaleDateString()}
				</p>
				<EditGalleryPublicState galleryId={gallery.id} initialIsPublic={gallery.is_public} />
				<a
					href={`/galleries/${gallery.id}`}
					target="_blank"
					rel="noopener noreferrer"
					className={styles.viewPublicLink}
				>
					View public page →
				</a>
			</header>

			<section className={styles.settingsSection}>
				<h3 className={shared.sectionTitle}>Gallery settings</h3>
				<EditGallerySlug galleryId={gallery.id} initialSlug={gallery.slug} />
				<ManageGalleryAssignments
					galleryId={gallery.id}
					initialAssignments={page_assignments ?? []}
				/>
			</section>

			<GalleryMediaManager
				gallery_id={gallery.id}
				gallery_media_rows={gallery_media_rows ?? []}
				all_media_items={all_media_items ?? []}
			/>
		</div>
	);
}
