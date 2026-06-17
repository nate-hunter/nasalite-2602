import { createClient } from '@/lib/supabase/server';
import UploadMediaForm from '@/app/admin/media/_components/UploadMediaForm';
import AppMediaList from '@/app/admin/media/_components/AppMediaList';
import shared from '@/app/admin/admin-shared.module.css';
import styles from './media-page.module.css';

export default async function AdminMediaPage() {
	const supabase = await createClient();
	const { data: mediaitems } = await supabase
		.from('media_items')
		.select('id, file_path, title, original_filename, mime_type, media_type, created_at')
		.eq('bucket_id', 'app-media-items')
		.order('created_at', { ascending: false });

	return (
		<>
			<section className={styles.section}>
				<UploadMediaForm />
			</section>
			<section className={styles.section}>
				<h2 className={shared.sectionTitle}>App media items</h2>
				<AppMediaList items={mediaitems ?? []} />
			</section>
		</>
	);
}
