import { createClient } from '@/lib/supabase/server';
import { ManagePageGalleries } from './_components/ManagePageGalleries';
import shared from '@/app/admin/admin-shared.module.css';
import styles from './manage-pages.module.css';

export default async function ManagePagesPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const page_param = typeof params['page'] === 'string' ? params['page'] : undefined;

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return null;

	// All distinct page_slug values — used to populate the page selector.
	const { data: slug_rows } = await supabase
		.from('gallery_page_assignments')
		.select('page_slug');

	const slugs = Array.from(new Set((slug_rows ?? []).map((r) => r.page_slug))).sort();

	// Honor URL param if present; otherwise fall back to first known slug or a default.
	const active_page =
		page_param && page_param.length > 0 ? page_param : (slugs[0] ?? 'wedding-memories');

	// Assignments for the active page, joined with gallery title + public state.
	const { data: assignments } = await supabase
		.from('gallery_page_assignments')
		.select('*, galleries(id, title, is_public)')
		.eq('page_slug', active_page)
		.order('display_order', { ascending: true });

	// Galleries not yet assigned to this page (exclusion query).
	const assigned_gallery_ids = (assignments ?? []).map((a) => a.gallery_id);

	const { data: unassigned_galleries } =
		assigned_gallery_ids.length > 0
			? await supabase
					.from('galleries')
					.select('id, title, is_public')
					.not('id', 'in', `(${assigned_gallery_ids.join(',')})`)
					.order('title', { ascending: true })
			: await supabase
					.from('galleries')
					.select('id, title, is_public')
					.order('title', { ascending: true });

	return (
		<section className={styles.section}>
			<h2 className={shared.sectionTitle}>Manage Pages</h2>
			<p className={styles.subtitle}>
				Control which galleries appear on each public page.
			</p>
			<ManagePageGalleries
				slugs={slugs}
				active_page={active_page}
				initial_assignments={
					(assignments ?? []) as Array<{
						id: string;
						gallery_id: string;
						page_slug: string;
						display_order: number;
						is_active: boolean;
						galleries: { id: string; title: string; is_public: boolean } | null;
					}>
				}
				initial_unassigned={unassigned_galleries ?? []}
			/>
		</section>
	);
}
