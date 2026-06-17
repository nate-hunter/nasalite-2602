import { VendorFilmsBlock } from './VendorFilmsBlock';
import { VendorGalleryTabs } from './VendorGalleryTabs';
import styles from '../wedding-memories.module.css';

import type { WeddingMemoriesGallery } from './wedding-memories.types';

export type { WeddingMemoriesGallery, WeddingMemoriesMediaItem } from './wedding-memories.types';

type WeddingMemoriesViewProps = {
	galleries: Array<WeddingMemoriesGallery>;
};

export default function WeddingMemoriesView({ galleries }: WeddingMemoriesViewProps) {
	return (
		<div className={styles.weddingMemoriesContent}>
			<div className={styles.weddingMemoriesFilmsColumn}>
				<VendorFilmsBlock />
			</div>
			<div className={styles.weddingMemoriesGalleriesColumn}>
			{galleries.length === 0 ? (
				<p className={styles.emptyState}>
					No public galleries are available yet. Please check back again soon.
				</p>
			) : (
				<VendorGalleryTabs key={galleries.map((g) => g.id).join(',')} galleries={galleries} />
			)}
			</div>
		</div>
	);
}
