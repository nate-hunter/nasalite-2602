import { AdminMediaThumb } from '@/app/admin/_components/AdminMediaThumb';
import { build_media_delivery_url } from '@/lib/media/build_media_delivery_url';

import styles from '../media-page.module.css';

export type AppMediaListItem = {
	id: string;
	file_path: string;
	title: string | null;
	original_filename: string;
	mime_type: string;
	media_type: string;
	created_at: string;
};

type AppMediaListProps = {
	items: Array<AppMediaListItem>;
};

export default function AppMediaList({ items }: AppMediaListProps) {
	if (items.length === 0) {
		return <p className={styles.empty}>No app media items yet. Upload a file above.</p>;
	}

	return (
		<ul className={styles.list}>
			{items.map((item) => {
				const is_image = item.media_type === 'photo' || item.mime_type.startsWith('image/');
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
				const alt = item.title || item.original_filename;

				return (
					<li key={item.id} className={styles.listItem}>
						<a href={full_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
							{is_image ? (
								<AdminMediaThumb media_url={media_url} alt={alt} className={styles.thumb} />
							) : (
								<div className={styles.thumbPlaceholder}>Video</div>
							)}
							<span className={styles.label}>{alt}</span>
							<span className={styles.meta}>
								{item.media_type} · {new Date(item.created_at).toLocaleDateString()}
							</span>
						</a>
					</li>
				);
			})}
		</ul>
	);
}
