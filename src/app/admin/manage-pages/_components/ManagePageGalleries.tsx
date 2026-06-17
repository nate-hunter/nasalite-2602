'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { normalizeSlug } from '@/utils/slug';
import styles from '../manage-pages.module.css';

type GalleryInfo = {
	id: string;
	title: string;
	is_public: boolean;
};

type AssignmentWithGallery = {
	id: string;
	gallery_id: string;
	page_slug: string;
	display_order: number;
	is_active: boolean;
	galleries: GalleryInfo | null;
};

type AssignmentEditorRow = {
	id: string;
	gallery_id: string;
	display_order: number;
	is_active: boolean;
	gallery_title: string;
	gallery_is_public: boolean;
};

type ManagePageGalleriesProps = {
	slugs: Array<string>;
	active_page: string;
	initial_assignments: Array<AssignmentWithGallery>;
	initial_unassigned: Array<GalleryInfo>;
};

function to_editor_row(assignment: AssignmentWithGallery): AssignmentEditorRow {
	return {
		id: assignment.id,
		gallery_id: assignment.gallery_id,
		display_order: assignment.display_order,
		is_active: assignment.is_active,
		gallery_title: assignment.galleries?.title ?? '(unknown)',
		gallery_is_public: assignment.galleries?.is_public ?? false,
	};
}

export function ManagePageGalleries({
	slugs,
	active_page,
	initial_assignments,
	initial_unassigned,
}: ManagePageGalleriesProps) {
	const router = useRouter();
	const supabase = useMemo(() => createClient(), []);

	const [assignments, set_assignments] = useState<Array<AssignmentEditorRow>>(() =>
		initial_assignments.map(to_editor_row)
	);
	const [unassigned, set_unassigned] = useState<Array<GalleryInfo>>(initial_unassigned);

	const [is_creating_page, set_is_creating_page] = useState(false);
	const [new_page_slug, set_new_page_slug] = useState('');

	const [selected_gallery_id, set_selected_gallery_id] = useState('');

	const [saving_target, set_saving_target] = useState<string | null>(null);
	const [message, set_message] = useState('');
	const [status, set_status] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

	const all_known_slugs = useMemo(() => {
		const base = slugs.includes(active_page) ? slugs : [...slugs, active_page].sort();
		return base;
	}, [slugs, active_page]);

	function set_error(text: string) {
		set_status('error');
		set_message(text);
	}

	function set_success(text: string) {
		set_status('success');
		set_message(text);
	}

	function handle_page_change(e: React.ChangeEvent<HTMLSelectElement>) {
		router.push(`/admin/manage-pages?page=${encodeURIComponent(e.target.value)}`);
	}

	function handle_new_page_submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const slug = normalizeSlug(new_page_slug);
		if (!slug) {
			set_error('Page name may only contain letters, numbers, and hyphens.');
			return;
		}
		if (all_known_slugs.includes(slug)) {
			set_error(`A page named "${slug}" already exists.`);
			return;
		}
		set_is_creating_page(false);
		set_new_page_slug('');
		set_message('');
		set_status('idle');
		router.push(`/admin/manage-pages?page=${encodeURIComponent(slug)}`);
	}

	async function handle_assign_gallery(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!selected_gallery_id) return;

		const next_order =
			assignments.length > 0 ? Math.max(...assignments.map((a) => a.display_order)) + 1 : 0;

		set_status('saving');
		set_saving_target('assign');
		set_message('');

		const { data, error } = await supabase
			.from('gallery_page_assignments')
			.insert({
				gallery_id: selected_gallery_id,
				page_slug: active_page,
				display_order: next_order,
				is_active: true,
			})
			.select('*, galleries(id, title, is_public)')
			.single();

		if (error || !data) {
			set_error(error?.message ?? 'Failed to assign gallery.');
			set_saving_target(null);
			return;
		}

		const typed = data as unknown as AssignmentWithGallery;
		set_assignments((prev) =>
			[...prev, to_editor_row(typed)].sort((a, b) => a.display_order - b.display_order)
		);
		set_unassigned((prev) => prev.filter((g) => g.id !== selected_gallery_id));
		set_selected_gallery_id('');
		set_saving_target(null);
		set_success('Gallery assigned to page.');
	}

	async function handle_save_assignment(row: AssignmentEditorRow) {
		set_status('saving');
		set_saving_target(`save:${row.id}`);
		set_message('');

		const { error } = await supabase
			.from('gallery_page_assignments')
			.update({
				display_order: row.display_order,
				is_active: row.is_active,
			})
			.eq('id', row.id);

		if (error) {
			set_error('Failed to save assignment.');
			set_saving_target(null);
			return;
		}

		set_assignments((prev) =>
			prev
				.map((item) => (item.id === row.id ? row : item))
				.sort((a, b) => a.display_order - b.display_order)
		);
		set_saving_target(null);
		set_success('Assignment saved.');
	}

	async function handle_remove_assignment(row: AssignmentEditorRow) {
		set_status('saving');
		set_saving_target(`remove:${row.id}`);
		set_message('');

		const { error } = await supabase
			.from('gallery_page_assignments')
			.delete()
			.eq('id', row.id);

		if (error) {
			set_error('Failed to remove gallery from page.');
			set_saving_target(null);
			return;
		}

		set_assignments((prev) => prev.filter((item) => item.id !== row.id));
		set_unassigned((prev) =>
			[
				...prev,
				{
					id: row.gallery_id,
					title: row.gallery_title,
					is_public: row.gallery_is_public,
				},
			].sort((a, b) => a.title.localeCompare(b.title))
		);
		set_saving_target(null);
		set_success('Gallery removed from page.');
	}

	return (
		<div>
			{/* Page selector */}
			<div className={styles.pageSelector}>
				<span className={styles.pageSelectorLabel}>Page:</span>
				{all_known_slugs.length > 0 ? (
					<select
						id="page-slug-select"
						className={styles.pageSelect}
						value={active_page}
						onChange={handle_page_change}
						aria-label="Select page"
					>
						{all_known_slugs.map((slug) => (
							<option key={slug} value={slug}>
								{slug}
							</option>
						))}
					</select>
				) : (
					<span className={styles.noPages}>No pages yet — create one below.</span>
				)}

				{is_creating_page ? (
					<form className={styles.newPageForm} onSubmit={handle_new_page_submit}>
						<input
							type="text"
							className={styles.newPageInput}
							placeholder="new-page-slug"
							value={new_page_slug}
							onChange={(e) => set_new_page_slug(e.target.value)}
							aria-label="New page slug"
							autoFocus
						/>
						<button type="submit" className={styles.confirmButton}>
							Create
						</button>
						<button
							type="button"
							className={styles.cancelButton}
							onClick={() => {
								set_is_creating_page(false);
								set_new_page_slug('');
								set_message('');
								set_status('idle');
							}}
						>
							Cancel
						</button>
					</form>
				) : (
					<button
						type="button"
						className={styles.newPageButton}
						onClick={() => set_is_creating_page(true)}
					>
						+ New page
					</button>
				)}
			</div>

			{/* Assigned galleries */}
			<section className={styles.assignedSection}>
				<h3 className={styles.sectionHeading}>
					{`Galleries on this page (${active_page})`}
				</h3>
				{assignments.length === 0 ? (
					<p className={styles.empty}>No galleries assigned to this page yet.</p>
				) : (
					<ul className={styles.assignmentList}>
						{assignments.map((row) => (
							<li key={row.id} className={styles.assignmentItem}>
								<div className={styles.assignmentGalleryInfo}>
									<a
										href={`/admin/galleries/${row.gallery_id}`}
										className={styles.galleryLink}
									>
										{row.gallery_title}
									</a>
									<span
										className={
											row.gallery_is_public ? styles.badgePublic : styles.badgePrivate
										}
									>
										{row.gallery_is_public ? 'Public' : 'Private'}
									</span>
								</div>

								<div className={styles.assignmentField}>
									<label
										htmlFor={`order-${row.id}`}
										className={styles.fieldLabel}
									>
										Order
									</label>
									<input
										id={`order-${row.id}`}
										type="number"
										min={0}
										className={styles.orderInput}
										value={row.display_order}
										onChange={(e) =>
											set_assignments((prev) =>
												prev.map((item) =>
													item.id === row.id
														? {
																...item,
																display_order:
																	Number.isFinite(Number(e.target.value)) &&
																	Number(e.target.value) >= 0
																		? Number(e.target.value)
																		: 0,
															}
														: item
												)
											)
										}
										aria-label={`Display order for ${row.gallery_title}`}
									/>
								</div>

								<label className={styles.activeToggle}>
									<input
										type="checkbox"
										checked={row.is_active}
										onChange={(e) =>
											set_assignments((prev) =>
												prev.map((item) =>
													item.id === row.id
														? { ...item, is_active: e.target.checked }
														: item
												)
											)
										}
									/>
									Active
								</label>

								<div className={styles.assignmentActions}>
									<button
										type="button"
										className={styles.saveButton}
										onClick={() => void handle_save_assignment(row)}
										disabled={saving_target !== null}
									>
										{saving_target === `save:${row.id}` ? 'Saving…' : 'Save'}
									</button>
									<button
										type="button"
										className={styles.removeButton}
										onClick={() => void handle_remove_assignment(row)}
										disabled={saving_target !== null}
									>
										{saving_target === `remove:${row.id}` ? 'Removing…' : 'Remove'}
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			{/* Assign a gallery */}
			<section className={styles.assignSection}>
				<h3 className={styles.sectionHeading}>Assign a gallery to this page</h3>
				{unassigned.length === 0 ? (
					<p className={styles.empty}>All galleries are already assigned to this page.</p>
				) : (
					<form className={styles.assignForm} onSubmit={handle_assign_gallery}>
						<select
							className={styles.gallerySelect}
							value={selected_gallery_id}
							onChange={(e) => set_selected_gallery_id(e.target.value)}
							aria-label="Select gallery to assign"
						>
							<option value="">Select a gallery…</option>
							{unassigned.map((g) => (
								<option key={g.id} value={g.id}>
									{g.title}
									{g.is_public ? '' : ' (private)'}
								</option>
							))}
						</select>
						<button
							type="submit"
							className={styles.assignButton}
							disabled={saving_target !== null || !selected_gallery_id}
						>
							{saving_target === 'assign' ? 'Assigning…' : '+ Assign'}
						</button>
					</form>
				)}
			</section>

			{message ? (
				<p
					className={status === 'error' ? styles.messageError : styles.messageSuccess}
					role={status === 'error' ? 'alert' : 'status'}
				>
					{message}
				</p>
			) : null}
		</div>
	);
}
