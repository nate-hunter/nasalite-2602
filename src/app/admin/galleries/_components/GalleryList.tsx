'use client';

import GalleryCard, { type GalleryCardCover } from '@/app/admin/galleries/_components/GalleryCard';
import styles from '../galleries-page.module.css';

export type GalleryListItem = {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	is_public: boolean;
	created_at: string;
	cover_image: GalleryCardCover;
};

type AssignmentSummary = {
	count: number;
	hasActive: boolean;
};

type GalleryListProps = {
	galleries: GalleryListItem[];
	assignmentSummaryByGalleryId: Record<string, AssignmentSummary>;
};

export default function GalleryList({ galleries, assignmentSummaryByGalleryId }: GalleryListProps) {
	if (galleries.length === 0) {
		return <p className={styles.empty}>No galleries yet. Create one above.</p>;
	}

	return (
		<ul className={styles.galleryGrid}>
			{galleries.map((g) => {
				const summary = assignmentSummaryByGalleryId[g.id] ?? { count: 0, hasActive: false };
				return (
					<li key={g.id}>
						<GalleryCard
							id={g.id}
							title={g.title}
							is_public={g.is_public}
							cover={g.cover_image}
							assignmentCount={summary.count}
							hasActiveAssignment={summary.hasActive}
						/>
					</li>
				);
			})}
		</ul>
	);
}
