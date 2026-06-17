import { NextResponse } from 'next/server';
import type { WeddingMemoriesGallery, WeddingMemoriesMediaItem } from '@/app/galleries/wedding-memories/_components/wedding-memories.types';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';

const WEDDING_PAGE_SLUG = 'wedding-memories';
const APP_MEDIA_BUCKET = 'app-media-items';

/** PostgREST encodes `.in('id', ids)` on the query string; keep chunks small to avoid URI limits. */
const MEDIA_ITEM_ID_IN_CHUNK = 100;

function chunkIds<T>(ids: Array<T>, size: number): Array<Array<T>> {
	// function chunkIds<T>(ids: T[], size: number): T[][] {
	if (ids.length === 0) return [];
	const chunks: Array<Array<T>> = [];
	for (let i = 0; i < ids.length; i += size) {
		chunks.push(ids.slice(i, i + size));
	}
	return chunks;
}

type AssignmentRow = Tables<'gallery_page_assignments'>;
type AssignmentSlice = Pick<
	AssignmentRow,
	'gallery_id' | 'display_order' | 'starts_at' | 'ends_at'
>;

function isAssignmentInActiveWindow(assignment: AssignmentSlice, nowIso: string): boolean {
	const startsAt = assignment.starts_at;
	const endsAt = assignment.ends_at;

	if (startsAt && startsAt > nowIso) return false;
	if (endsAt && endsAt < nowIso) return false;
	return true;
}

function sortMediaItemsByCreatedAt(items: Array<WeddingMemoriesMediaItem>) {
	return [...items].sort((a, b) => {
		const aTime = Date.parse(a.created_at);
		const bTime = Date.parse(b.created_at);
		return aTime - bTime;
	});
}

export async function GET() {
	console.log('^^^ GET WEDDING GALLERIES ^^^');
	try {
		const supabase = await createClient();
		const nowIso = new Date().toISOString();

		const { data: assignments, error: assignmentError } = await supabase
			.from('gallery_page_assignments')
			.select('gallery_id, display_order, starts_at, ends_at')
			.eq('page_slug', WEDDING_PAGE_SLUG)
			.eq('is_active', true)
			.order('display_order', { ascending: true });

		if (assignmentError) {
			return NextResponse.json(
				{ error: 'Failed to fetch page assignments', details: assignmentError.message },
				{ status: 500 }
			);
		}

		const activeAssignments = (assignments ?? []).filter((assignment) =>
			isAssignmentInActiveWindow(assignment, nowIso)
		);

		if (activeAssignments.length === 0) {
			return NextResponse.json(
				{ galleries: [] satisfies Array<WeddingMemoriesGallery> },
				{ status: 200 }
			);
		}

		const assignmentByGalleryId = new Map<string, AssignmentSlice>();
		for (const assignment of activeAssignments) {
			assignmentByGalleryId.set(assignment.gallery_id, assignment);
		}

		const assignedGalleryIds = Array.from(assignmentByGalleryId.keys());

		const { data: galleries, error: galleriesError } = await supabase
			.from('galleries')
			.select('id, slug, title, description')
			.in('id', assignedGalleryIds)
			.eq('is_public', true);

		if (galleriesError) {
			return NextResponse.json(
				{ error: 'Failed to fetch galleries', details: galleriesError.message },
				{ status: 500 }
			);
		}

		const publicGalleries = galleries ?? [];
		if (publicGalleries.length === 0) {
			return NextResponse.json(
				{ galleries: [] satisfies Array<WeddingMemoriesGallery> },
				{ status: 200 }
			);
		}

		const publicGalleryIds = publicGalleries.map((gallery) => gallery.id);

		const { data: galleryMediaRows, error: galleryMediaError } = await supabase
			.from('gallery_media_items')
			.select('gallery_id, media_item_id')
			.in('gallery_id', publicGalleryIds);

		if (galleryMediaError) {
			return NextResponse.json(
				{ error: 'Failed to fetch gallery media mappings', details: galleryMediaError.message },
				{ status: 500 }
			);
		}

		const mediaMappings = galleryMediaRows ?? [];
		const mediaItemIds = Array.from(new Set(mediaMappings.map((row) => row.media_item_id)));

		const mediaById = new Map<string, WeddingMemoriesMediaItem>();
		if (mediaItemIds.length > 0) {
			for (const idChunk of chunkIds(mediaItemIds, MEDIA_ITEM_ID_IN_CHUNK)) {
				const { data: mediaItems, error: mediaItemsError } = await supabase
					.from('media_items')
					.select(
						'id, file_path, media_type, mime_type, title, original_filename, created_at, width, height'
					)
					.in('id', idChunk)
					.eq('bucket_id', APP_MEDIA_BUCKET)
					.eq('is_public', true);

				if (mediaItemsError) {
					return NextResponse.json(
						{ error: 'Failed to fetch media items', details: mediaItemsError.message },
						{ status: 500 }
					);
				}

				for (const item of mediaItems ?? []) {
					mediaById.set(item.id, item);
				}
			}
		}

		const mediaIdsByGalleryId = new Map<string, string[]>();
		for (const row of mediaMappings) {
			const existing = mediaIdsByGalleryId.get(row.gallery_id) ?? [];
			existing.push(row.media_item_id);
			mediaIdsByGalleryId.set(row.gallery_id, existing);
		}

		const responseGalleries: Array<WeddingMemoriesGallery> = publicGalleries
			.map((gallery) => {
				const assignment = assignmentByGalleryId.get(gallery.id);
				if (!assignment) return null;

				const mediaIds = mediaIdsByGalleryId.get(gallery.id) ?? [];
				const mediaItems: Array<WeddingMemoriesMediaItem> = mediaIds
					.map((mediaId) => mediaById.get(mediaId))
					.filter((item): item is WeddingMemoriesMediaItem => Boolean(item));

				return {
					id: gallery.id,
					slug: gallery.slug,
					title: gallery.title,
					description: gallery.description,
					display_order: assignment.display_order,
					media_items: sortMediaItemsByCreatedAt(mediaItems),
				};
			})
			.filter((gallery): gallery is WeddingMemoriesGallery => Boolean(gallery))
			.sort((a, b) => a.display_order - b.display_order);

		return NextResponse.json({ galleries: responseGalleries }, { status: 200 });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : 'Unexpected error loading wedding memories.';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
