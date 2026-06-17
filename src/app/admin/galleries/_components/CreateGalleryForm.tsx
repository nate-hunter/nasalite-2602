'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createSlugCandidate } from '@/utils/slug';
import styles from '../galleries-page.module.css';

export default function CreateGalleryForm() {
	const router = useRouter();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [isPublic, setIsPublic] = useState(true);
	const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState('');

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed) {
			setMessage('Title is required.');
			setStatus('error');
			return;
		}

		setStatus('submitting');
		setMessage('');

		const supabase = createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			setMessage('You must be signed in to create a gallery.');
			setStatus('error');
			return;
		}

		let insertErrorMessage: string | null = null;

		for (let attempt = 0; attempt < 6; attempt += 1) {
			const nextSlug = createSlugCandidate(trimmed, attempt);
			const { error } = await supabase.from('galleries').insert({
				title: trimmed,
				slug: nextSlug,
				description: description.trim() || null,
				is_public: isPublic,
				is_app_gallery: true,
				creator_id: user.id,
			});

			if (!error) {
				insertErrorMessage = null;
				break;
			}

			// Handle race conditions where another tab/user inserts the same slug first.
			if (error.code === '23505') {
				insertErrorMessage =
					'Could not create a unique gallery slug for this title. Try a more specific title.';
				continue;
			}

			insertErrorMessage = error.message || 'Failed to create gallery.';
			break;
		}

		if (insertErrorMessage) {
			setMessage(insertErrorMessage);
			setStatus('error');
			return;
		}

		setStatus('success');
		setMessage('Gallery created.');
		setTitle('');
		setDescription('');
		router.refresh();
	}

	return (
		<form onSubmit={handleSubmit} className={styles.form}>
			<div className={styles.formRow}>
				<label htmlFor="gallery-title" className={styles.label}>
					Title
				</label>
				<input
					id="gallery-title"
					type="text"
					value={title}
					onChange={(e) => {
						setTitle(e.target.value);
						setStatus('idle');
						setMessage('');
					}}
					className={styles.input}
					placeholder="e.g. Wedding highlights"
					required
				/>
			</div>
			<div className={styles.formRow}>
				<label htmlFor="gallery-description" className={styles.label}>
					Description (optional)
				</label>
				<textarea
					id="gallery-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className={styles.textarea}
					placeholder="Short description for the gallery"
					rows={2}
				/>
			</div>
			<div className={styles.formRow}>
				<label className={styles.checkboxLabel}>
					<input
						type="checkbox"
						checked={isPublic}
						onChange={(e) => setIsPublic(e.target.checked)}
						className={styles.checkbox}
					/>
					Public (visible to all users)
				</label>
			</div>
			{message && (
				<p
					className={status === 'error' ? styles.messageError : styles.messageSuccess}
					role="alert"
				>
					{message}
				</p>
			)}
			<button type="submit" className={styles.submit} disabled={status === 'submitting'}>
				{status === 'submitting' ? 'Creating…' : 'Create gallery'}
			</button>
		</form>
	);
}
