'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/database.types';
import styles from '../[id]/gallery-detail.module.css';

type GalleryPageAssignment = Tables<'gallery_page_assignments'>;

type AssignmentEditorRow = {
	id: string;
	page_slug: string;
	display_order: number;
	is_active: boolean;
	starts_at: string;
	ends_at: string;
};

type ManageGalleryAssignmentsProps = {
	galleryId: string;
	initialAssignments: GalleryPageAssignment[];
};

function toDateTimeLocalValue(iso: string | null): string {
	if (!iso) return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
	return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function toIsoOrNull(localValue: string): string | null {
	const trimmed = localValue.trim();
	if (!trimmed) return null;
	const date = new Date(trimmed);
	if (Number.isNaN(date.getTime())) return null;
	return date.toISOString();
}

function toEditorRows(rows: GalleryPageAssignment[]): AssignmentEditorRow[] {
	return rows
		.slice()
		.sort((a, b) => a.display_order - b.display_order)
		.map((row) => ({
			id: row.id,
			page_slug: row.page_slug,
			display_order: row.display_order,
			is_active: row.is_active,
			starts_at: toDateTimeLocalValue(row.starts_at),
			ends_at: toDateTimeLocalValue(row.ends_at),
		}));
}

function toFriendlyErrorMessage(errorMessage: string | null, fallback: string): string {
	if (!errorMessage) return fallback;
	return errorMessage;
}

export default function ManageGalleryAssignments({
	galleryId: _galleryId,
	initialAssignments,
}: ManageGalleryAssignmentsProps) {
	const supabase = useMemo(() => createClient(), []);
	const [assignments, setAssignments] = useState<AssignmentEditorRow[]>(() =>
		toEditorRows(initialAssignments)
	);
	const [message, setMessage] = useState('');
	const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
	const [savingTarget, setSavingTarget] = useState<string | null>(null);

	function setError(text: string) {
		setStatus('error');
		setMessage(text);
	}

	function setSuccess(text: string) {
		setStatus('success');
		setMessage(text);
	}

	async function handleSaveAssignment(row: AssignmentEditorRow) {
		setStatus('saving');
		setSavingTarget(`save:${row.id}`);
		setMessage('');

		const startsAtIso = toIsoOrNull(row.starts_at);
		const endsAtIso = toIsoOrNull(row.ends_at);

		const { error } = await supabase
			.from('gallery_page_assignments')
			.update({
				is_active: row.is_active,
				starts_at: startsAtIso,
				ends_at: endsAtIso,
			})
			.eq('id', row.id);

		if (error) {
			setError(toFriendlyErrorMessage(error.message, 'Failed to update assignment.'));
			setSavingTarget(null);
			return;
		}

		setAssignments((prev) => prev.map((item) => (item.id === row.id ? row : item)));
		setSavingTarget(null);
		setSuccess('Assignment updated.');
	}

	async function handleDeleteAssignment(id: string) {
		setStatus('saving');
		setSavingTarget(`delete:${id}`);
		setMessage('');

		const { error } = await supabase.from('gallery_page_assignments').delete().eq('id', id);
		if (error) {
			setError(toFriendlyErrorMessage(error.message, 'Failed to remove assignment.'));
			setSavingTarget(null);
			return;
		}

		setAssignments((prev) => prev.filter((row) => row.id !== id));
		setSavingTarget(null);
		setSuccess('Assignment removed.');
	}

	return (
		<div className={styles.assignmentPanel}>
			<h4 className={styles.assignmentTitle}>Page assignments</h4>

			{assignments.length === 0 ? (
				<p className={styles.assignmentEmpty}>No assignments yet.</p>
			) : (
				<ul className={styles.assignmentList}>
					{assignments.map((row) => (
						<li key={row.id} className={styles.assignmentItem}>
							<div className={styles.assignmentField}>
								<span className={styles.assignmentFieldLabel}>Page</span>
								<span>{row.page_slug}</span>
							</div>

							<label className={styles.assignmentToggle}>
								<input
									type="checkbox"
									checked={row.is_active}
									onChange={(e) =>
										setAssignments((prev) =>
											prev.map((item) =>
												item.id === row.id ? { ...item, is_active: e.target.checked } : item
											)
										)
									}
								/>
								Active
							</label>

							<div className={styles.assignmentActions}>
								<button
									className={styles.assignmentButton}
									type="button"
									onClick={() => void handleSaveAssignment(row)}
									disabled={savingTarget !== null}
								>
									{savingTarget === `save:${row.id}` ? 'Saving…' : 'Save'}
								</button>
								<button
									className={styles.assignmentDangerButton}
									type="button"
									onClick={() => void handleDeleteAssignment(row.id)}
									disabled={savingTarget !== null}
								>
									{savingTarget === `delete:${row.id}` ? 'Removing…' : 'Remove'}
								</button>
							</div>
						</li>
					))}
				</ul>
			)}

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
