import { headers } from 'next/headers';
import WeddingMemoriesView, {
	type WeddingMemoriesGallery,
} from '@/app/galleries/wedding-memories/_components/WeddingMemoriesView';
import styles from './wedding-memories.module.css';

type WeddingMemoriesApiResponse = {
	galleries: Array<WeddingMemoriesGallery>;
};

function getBaseUrl(headerStore: Awaited<ReturnType<typeof headers>>) {
	const origin = headerStore.get('origin');
	if (origin) return origin;

	const proto = headerStore.get('x-forwarded-proto') ?? 'http';
	const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000';
	return `${proto}://${host}`;
}

export default async function WeddingGalleriesPage() {
	console.log('### App/Public Galleries ###');
	const headerStore = await headers();
	const baseUrl = getBaseUrl(headerStore);

	let galleries: Array<WeddingMemoriesGallery> = [];
	let loadError: string | null = null;

	try {
		console.log('*** Fetch Galleries ***');
		const response = await fetch(`${baseUrl}/api/galleries/wedding-memories`, {
			cache: 'no-store',
		});

		if (!response.ok) {
			loadError = 'Unable to load wedding memories right now.';
		} else {
			const payload = (await response.json()) as WeddingMemoriesApiResponse;
			galleries = payload.galleries ?? [];
		}
	} catch {
		loadError = 'Unable to load wedding memories right now.';
	}

	return (
		<div className={styles.page}>
			{/* <h1 className={styles.title}>Galleries {'{Public}'}</h1> */}
			<h1 className={styles.title}>Wedding Memories</h1>
			{/* <p className={styles.subtitle}>
				Public galleries curated by the super admin, including photos and videos.
			</p> */}
			{loadError ? (
				<p className={styles.errorState} role="alert">
					{loadError}
				</p>
			) : (
				<WeddingMemoriesView galleries={galleries} />
			)}
		</div>
	);
}
