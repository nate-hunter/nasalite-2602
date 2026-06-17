'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

import styles from '../gallery-detail.module.css';

type EditGalleryPublicStateProps = {
	galleryId: string;
	initialIsPublic: boolean;
};

type SaveStatus = 'idle' | 'saving' | 'error';

export default function EditGalleryPublicState({
	galleryId,
	initialIsPublic,
}: EditGalleryPublicStateProps): React.JSX.Element {
	const router = useRouter();
	const supabase = useMemo(() => createClient(), []);
	const [isPublic, setIsPublic] = useState(initialIsPublic);
	const [status, setStatus] = useState<SaveStatus>('idle');
	const [errorMessage, setErrorMessage] = useState('');

	async function handleToggle() {
		const nextValue = !isPublic;
		setIsPublic(nextValue); // optimistic
		setStatus('saving');
		setErrorMessage('');

		const { error } = await supabase
			.from('galleries')
			.update({ is_public: nextValue })
			.eq('id', galleryId);

		if (error) {
			setIsPublic(!nextValue); // revert
			setStatus('error');
			setErrorMessage(error.message || 'Failed to update visibility.');
			return;
		}

		setStatus('idle');
		router.refresh();
	}

	return (
		<div className={styles.publicStateRow}>
			<span
				className={styles.publicToggleLabel}
				id={`public-toggle-label-${galleryId}`}
			>
				{isPublic ? 'Public' : 'Private'}
			</span>
			<button
				role="switch"
				aria-checked={isPublic}
				aria-labelledby={`public-toggle-label-${galleryId}`}
				className={styles.publicToggleButton}
				onClick={() => void handleToggle()}
				disabled={status === 'saving'}
			>
				<span
					className={`${styles.publicToggleTrack} ${isPublic ? styles.publicToggleTrackOn : ''}`}
				>
					<span className={styles.publicToggleThumb} />
				</span>
			</button>
			{status === 'error' && errorMessage ? (
				<p className={styles.messageError} role="alert">
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}
