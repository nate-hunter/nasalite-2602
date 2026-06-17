'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminMediaThumb } from '@/app/admin/_components/AdminMediaThumb';
import { build_media_delivery_url } from '@/lib/media/build_media_delivery_url';
import type { GalleryCardCover } from '@/lib/galleries/resolve_gallery_card_cover';
import type { MediaDeliveryBucketId } from '@/lib/media/media_delivery_presets';
import styles from '../galleries-page.module.css';

export type { GalleryCardCover };

type GalleryCardProps = {
	id: string;
	title: string;
	is_public: boolean;
	cover: GalleryCardCover;
	assignmentCount: number;
	hasActiveAssignment: boolean;
};

export default function GalleryCard({
	id,
	title,
	is_public,
	cover,
	assignmentCount,
	hasActiveAssignment,
}: GalleryCardProps) {
	const supabase = useMemo(() => createClient(), []);
	const [isPublic, setIsPublic] = useState(is_public);

	// Re-derive status whenever isPublic changes (hasActiveAssignment is server-stable).
	const status = isPublic && hasActiveAssignment ? 'live' : isPublic ? 'public' : 'private';

	const cover_media_url = cover
		? build_media_delivery_url({
				file_path: cover.file_path,
				bucket_id: cover.bucket_id as MediaDeliveryBucketId,
				preset: 'admin_thumb',
			})
		: null;

	async function handleToggle() {
		const next = !isPublic;
		setIsPublic(next); // optimistic
		const { error } = await supabase.from('galleries').update({ is_public: next }).eq('id', id);
		if (error) setIsPublic(!next); // revert on DB error
	}

	return (
		<article className={styles.card}>
			{/* Navigation area — cover + title + badge */}
			<Link href={`/admin/galleries/${id}`} className={styles.cardLink}>
				<div className={styles.cover}>
					{cover_media_url ? (
						<AdminMediaThumb
							media_url={cover_media_url}
							alt={`Cover for ${title}`}
							className={styles.coverImage}
						/>
					) : (
						<div className={styles.coverPlaceholder} aria-hidden="true" />
					)}
				</div>
				<div className={styles.cardBody}>
					<span className={styles.cardTitle}>{title}</span>
					<div className={styles.cardMeta}>
						<span
							className={`${styles.badge} ${
								status === 'live'
									? styles.badgeLive
									: status === 'public'
										? styles.badgePublic
										: styles.badgePrivate
							}`}
						>
							{status === 'live' ? 'Live' : status === 'public' ? 'Public' : 'Private'}
						</span>
						<span className={styles.assignmentPill}>
							{assignmentCount > 0
								? `${assignmentCount} page${assignmentCount !== 1 ? 's' : ''}`
								: 'Unassigned'}
						</span>
					</div>
				</div>
			</Link>

			{/* Footer — is_public toggle (does not navigate) */}
			<div className={styles.cardFooter}>
				<span className={styles.toggleLabel} id={`toggle-label-${id}`}>
					{isPublic ? 'Public' : 'Private'}
				</span>
				<button
					role="switch"
					aria-checked={isPublic}
					aria-labelledby={`toggle-label-${id}`}
					onClick={() => void handleToggle()}
					className={styles.toggleButton}
				>
					<span className={`${styles.toggleTrack} ${isPublic ? styles.toggleTrackOn : ''}`}>
						<span className={styles.toggleThumb} />
					</span>
				</button>
			</div>
		</article>
	);
}
