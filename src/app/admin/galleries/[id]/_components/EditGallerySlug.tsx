'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { normalizeSlug } from '@/utils/slug';

import styles from '../gallery-detail.module.css';

type EditGallerySlugProps = {
	galleryId: string;
	initialSlug: string;
};

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export default function EditGallerySlug({
	galleryId,
	initialSlug,
}: EditGallerySlugProps): React.JSX.Element {
	const router = useRouter();
	const supabase = useMemo(() => createClient(), []);
	const [slugInput, setSlugInput] = useState(initialSlug);
	const [savedSlug, setSavedSlug] = useState(() => normalizeSlug(initialSlug));
	const [status, setStatus] = useState<SaveStatus>('idle');
	const [message, setMessage] = useState('');

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const nextSlug = normalizeSlug(slugInput);
		if (!nextSlug) {
			setStatus('error');
			setMessage('Slug is required and may only contain letters, numbers, and hyphens.');
			return;
		}

		if (nextSlug === savedSlug) {
			setSlugInput(nextSlug);
			setStatus('success');
			setMessage('Slug is unchanged.');
			return;
		}

		setStatus('saving');
		setMessage('');

		const { error } = await supabase
			.from('galleries')
			.update({ slug: nextSlug })
			.eq('id', galleryId);

		if (error) {
			setStatus('error');
			if (error.code === '23505') {
				setMessage('This slug is already used on one of your galleries.');
				return;
			}

			setMessage(error.message || 'Failed to update slug.');
			return;
		}

		setSavedSlug(nextSlug);
		setSlugInput(nextSlug);
		setStatus('success');
		setMessage('Slug updated.');
		router.refresh();
	}

	return (
		<form className={styles.slugPanel} onSubmit={handleSubmit}>
			<label htmlFor={`gallery-slug-${galleryId}`} className={styles.slugLabel}>
				URL slug
			</label>
			<input
				id={`gallery-slug-${galleryId}`}
				className={styles.slugInput}
				type="text"
				value={slugInput}
				onChange={(event) => {
					setSlugInput(event.target.value);
					setStatus('idle');
					setMessage('');
				}}
				placeholder="e.g. wedding-memories"
				autoCapitalize="none"
				autoCorrect="off"
				spellCheck={false}
			/>
			<p className={styles.slugHint}>
				Lowercase letters, numbers, and hyphens. Must be unique among your galleries.
			</p>
			{message ? (
				<p
					className={status === 'error' ? styles.messageError : styles.messageSuccess}
					role={status === 'error' ? 'alert' : 'status'}
				>
					{message}
				</p>
			) : null}
			<button className={styles.slugSubmit} type="submit" disabled={status === 'saving'}>
				{status === 'saving' ? 'Saving…' : 'Save'}
			</button>
		</form>
	);
}
