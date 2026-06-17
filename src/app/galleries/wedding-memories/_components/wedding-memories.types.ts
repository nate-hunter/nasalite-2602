/** Shared shapes for wedding-memories gallery UI and the wedding-memories galleries API. */

export type WeddingMemoriesMediaItem = {
	id: string;
	file_path: string;
	media_type: string;
	mime_type: string;
	title: string;
	original_filename: string;
	created_at: string;
	width: number | null;
	height: number | null;
};

export type WeddingMemoriesGallery = {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	display_order: number;
	media_items: Array<WeddingMemoriesMediaItem>;
};
