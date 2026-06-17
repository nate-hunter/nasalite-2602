import type { Tables } from '@/lib/supabase/database.types';

/** Columns selected for `media_items` in gallery admin views. */
export type GalleryDetailMediaItem = Pick<
	Tables<'media_items'>,
	'id' | 'title' | 'original_filename' | 'file_path' | 'mime_type' | 'media_type' | 'bucket_id' | 'created_at'
>;

/** Shape of `gallery_media_items` rows with nested `media_items` from `.select(..., media_items(...))`. */
export type GalleryMediaJoinRow = Pick<
	Tables<'gallery_media_items'>,
	'id' | 'media_item_id' | 'added_at'
> & {
	media_items: GalleryDetailMediaItem | null;
};
