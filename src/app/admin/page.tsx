import Link from 'next/link';

import { AdminMediaThumb } from '@/app/admin/_components/AdminMediaThumb';
import { build_media_delivery_url } from '@/lib/media/build_media_delivery_url';
import { createClient } from '@/lib/supabase/server';
import shared from './admin-shared.module.css';
import styles from './admin-page.module.css';

export default async function SuperUserAdminPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Admin layout already guards this route; null-check is a safety net.
	if (!user) return null;

	const [{ data: galleries }, { data: items }] = await Promise.all([
		supabase
			.from('galleries')
			.select('id, title, is_public, created_at')
			.eq('creator_id', user.id)
			.order('created_at', { ascending: false }),
		supabase
			.from('media_items')
			.select('id, file_path, title, original_filename, mime_type, media_type, created_at')
			.eq('bucket_id', 'app-media-items')
			.order('created_at', { ascending: false }),
	]);

	return (
		<>
			<section className={styles.section}>
				<h2 className={shared.sectionTitle}>Galleries</h2>
				<div className={styles.galleriesRow}>
					{(galleries ?? []).map((g) => (
						<Link key={g.id} href={`/admin/galleries/${g.id}`} className={styles.galleryCard}>
							<div className={styles.galleryThumb} aria-hidden="true" />
							<div className={styles.galleryText}>
								<span className={styles.galleryName}>{g.title}</span>
								<span className={styles.galleryMeta}>
									{g.is_public ? 'Public' : 'Private'} ·{' '}
									{new Date(g.created_at).toLocaleDateString()}
								</span>
							</div>
						</Link>
					))}
					{(galleries ?? []).length === 0 && <p className={styles.empty}>No galleries yet.</p>}
				</div>
			</section>

			<section className={styles.section}>
				<h2 className={shared.sectionTitle}>Uploaded Media</h2>
				<div className={styles.masonry}>
					{(items ?? []).map((item) => {
						const is_image = item.media_type === 'photo' || item.mime_type?.startsWith('image/');
						const alt = item.title || item.original_filename;
						const media_url = build_media_delivery_url({
							file_path: item.file_path,
							bucket_id: 'app-media-items',
							preset: 'admin_thumb',
						});
						const full_url = build_media_delivery_url({
							file_path: item.file_path,
							bucket_id: 'app-media-items',
							preset: 'original',
						});
						return (
							<div key={item.id} className={styles.mediaCard}>
								<Link
									href={full_url}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.mediaLink}
								>
									{is_image ? (
										<AdminMediaThumb
											media_url={media_url}
											alt={alt}
											className={styles.mediaThumb}
										/>
									) : (
										<div className={styles.mediaThumbPlaceholder}>Video</div>
									)}
									<div className={styles.mediaMeta}>
										<span className={styles.mediaLabel}>{alt}</span>
										<span className={styles.mediaSub}>
											{item.media_type} · {new Date(item.created_at).toLocaleDateString()}
										</span>
									</div>
								</Link>
							</div>
						);
					})}
					{(items ?? []).length === 0 && <p className={styles.empty}>No media uploaded yet.</p>}
				</div>
			</section>
		</>
	);
}
