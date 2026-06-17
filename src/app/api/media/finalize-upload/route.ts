/**
 * Finalize Upload Endpoint
 *
 * Creates the database record after file has been uploaded to Supabase Storage.
 *
 * Flow (media-items / user uploads):
 * 1. Client has already uploaded file to Supabase using signed URL
 * 2. Client sends file path and all extracted metadata to this endpoint
 * 3. Server performs reverse geocoding if coordinates present
 * 4. Server creates media_items record with source = 'guest'
 * 5. Server links media item to user's default gallery (always)
 * 6. Server optionally links media item to a user-selected gallery (non-fatal if it fails)
 * 7. Server returns created record
 *
 * Flow (app-media-items / admin uploads):
 * 1–3. Same as above
 * 4. Server creates media_items record with source = 'admin' and is_public = true
 * 5. gallery_id is required; server links directly to that app gallery (no default gallery step)
 * 6. Server returns created record
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json, TablesInsert } from '@/lib/supabase/database.types';
import { reverseGeocode } from '@/utils/geocoding';
import { sanitizeJsonForPostgres } from '@/utils/sanitize_json_for_postgres';

type AllowedBucketId = 'media-items' | 'app-media-items';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type FinalizeUploadBody = {
	bucket_id?: AllowedBucketId;
	file_path: TablesInsert<'media_items'>['file_path'];
	title?: TablesInsert<'media_items'>['title'];
	original_filename: TablesInsert<'media_items'>['original_filename'];
	mime_type: TablesInsert<'media_items'>['mime_type'];
	file_size?: TablesInsert<'media_items'>['file_size'];
	width?: TablesInsert<'media_items'>['width'];
	height?: TablesInsert<'media_items'>['height'];
	lat?: TablesInsert<'media_items'>['lat'];
	lon?: TablesInsert<'media_items'>['lon'];
	camera_make?: TablesInsert<'media_items'>['camera_make'];
	camera_model?: TablesInsert<'media_items'>['camera_model'];
	date_taken?: TablesInsert<'media_items'>['date_taken'];
	exif_data?: TablesInsert<'media_items'>['exif_data'];
	/** Optional additional gallery to assign the item to, beyond the default "Uploads" gallery. */
	gallery_id?: string;
};

function isJsonSerializable(value: unknown): value is Json {
	try {
		JSON.stringify(value);
		return true;
	} catch {
		return false;
	}
}

/** Positive integer from flat EXIF object (exifr-style keys). */
function readExifDimension(exif: unknown, kind: 'width' | 'height'): number | null {
	if (!exif || typeof exif !== 'object' || Array.isArray(exif)) return null;
	const o = exif as Record<string, unknown>;
	const keys =
		kind === 'width'
			? ['ImageWidth', 'PixelXDimension', 'ExifImageWidth']
			: ['ImageHeight', 'PixelYDimension', 'ExifImageHeight'];
	for (const key of keys) {
		const v = o[key];
		if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
			return Math.round(v);
		}
	}
	return null;
}

function sanitizeFilename(original: string) {
	const withoutPath = original.split(/[/\\]/).pop() ?? 'file';
	const collapsed = withoutPath.trim().replace(/\s+/g, '-');
	const safe = collapsed.replace(/[^a-zA-Z0-9._-]+/g, '');
	const trimmed = safe.replace(/^[-_.]+|[-_.]+$/g, '');
	return trimmed.length > 0 ? trimmed.slice(0, 120) : 'file';
}

function isValidBody(value: unknown): value is FinalizeUploadBody {
	if (!value || typeof value !== 'object') return false;
	const v = value as Record<string, unknown>;

	if (typeof v.file_path !== 'string' || v.file_path.length === 0) return false;
	if (typeof v.original_filename !== 'string' || v.original_filename.length === 0) return false;
	if (typeof v.mime_type !== 'string' || v.mime_type.length === 0) return false;

	if (typeof v.title !== 'undefined' && typeof v.title !== 'string') return false;
	if (
		typeof v.bucket_id !== 'undefined' &&
		v.bucket_id !== 'media-items' &&
		v.bucket_id !== 'app-media-items'
	)
		return false;

	if (typeof v.file_size !== 'undefined' && v.file_size !== null) {
		if (typeof v.file_size !== 'number' || !Number.isFinite(v.file_size) || v.file_size <= 0)
			return false;
	}

	if (typeof v.width !== 'undefined' && v.width !== null) {
		if (typeof v.width !== 'number' || !Number.isFinite(v.width) || v.width <= 0) return false;
	}
	if (typeof v.height !== 'undefined' && v.height !== null) {
		if (typeof v.height !== 'number' || !Number.isFinite(v.height) || v.height <= 0) return false;
	}

	if (typeof v.lat !== 'undefined' && v.lat !== null) {
		if (typeof v.lat !== 'number' || !Number.isFinite(v.lat)) return false;
	}
	if (typeof v.lon !== 'undefined' && v.lon !== null) {
		if (typeof v.lon !== 'number' || !Number.isFinite(v.lon)) return false;
	}

	if (
		typeof v.camera_make !== 'undefined' &&
		v.camera_make !== null &&
		typeof v.camera_make !== 'string'
	)
		return false;
	if (
		typeof v.camera_model !== 'undefined' &&
		v.camera_model !== null &&
		typeof v.camera_model !== 'string'
	)
		return false;
	if (
		typeof v.date_taken !== 'undefined' &&
		v.date_taken !== null &&
		typeof v.date_taken !== 'string'
	)
		return false;

	if (
		typeof v.exif_data !== 'undefined' &&
		v.exif_data !== null &&
		!isJsonSerializable(v.exif_data)
	) {
		return false;
	}

	if (typeof v.gallery_id !== 'undefined') {
		if (typeof v.gallery_id !== 'string' || !UUID_REGEX.test(v.gallery_id)) return false;
	}

	return true;
}

export async function POST(req: Request) {
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!isValidBody(body)) {
		return NextResponse.json(
			{
				error:
					'Invalid request body. Expected { file_path, original_filename, mime_type, file_size?, title?, bucket_id?, width?, height?, lat?, lon?, camera_make?, camera_model?, date_taken?, exif_data?, gallery_id? }',
			},
			{ status: 400 }
		);
	}

	const supabase = await createClient();
	const { data: auth, error: authError } = await supabase.auth.getUser();
	if (authError || !auth.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const bucketId: AllowedBucketId = body.bucket_id ?? 'media-items';

	if (bucketId === 'app-media-items') {
		const { data: profile } = await supabase
			.from('user_profiles')
			.select('app_role')
			.eq('id', auth.user.id)
			.single();

		if (profile?.app_role !== 'super_admin') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
	}

	// app-media-items: gallery_id is required — app uploads always belong to an explicit gallery.
	if (bucketId === 'app-media-items' && !body.gallery_id) {
		return NextResponse.json(
			{ error: 'gallery_id is required when uploading to app-media-items' },
			{ status: 400 }
		);
	}

	const filename = sanitizeFilename(body.original_filename);
	const title = (
		body.title && body.title.trim().length > 0 ? body.title.trim() : filename
	) as string;

	const exifPayload =
		body.exif_data != null ? sanitizeJsonForPostgres(body.exif_data) : null;
	const width = body.width ?? readExifDimension(exifPayload, 'width') ?? null;
	const height = body.height ?? readExifDimension(exifPayload, 'height') ?? null;

	const hasGps =
		typeof body.lat === 'number' &&
		typeof body.lon === 'number' &&
		Number.isFinite(body.lat) &&
		Number.isFinite(body.lon);

	let location_name: string | null = null;
	if (hasGps) {
		location_name = await reverseGeocode(body.lat as number, body.lon as number);
	}

	const { data: inserted, error: insertError } = await supabase
		.from('media_items')
		.insert({
			bucket_id: bucketId,
			file_path: body.file_path,
			filename,
			original_filename: body.original_filename,
			mime_type: body.mime_type,
			file_size: body.file_size ?? null,
			title,
			uploader_id: auth.user.id,
			source: bucketId === 'app-media-items' ? 'admin' : 'guest',
			is_public: bucketId === 'app-media-items',
			lat: body.lat ?? null,
			lon: body.lon ?? null,
			exif_data: exifPayload,
			camera_make: body.camera_make ?? null,
			camera_model: body.camera_model ?? null,
			date_taken: body.date_taken ?? null,
			width,
			height,
			location_name,
		} satisfies TablesInsert<'media_items'>)
		.select('*')
		.single();

	if (insertError || !inserted) {
		return NextResponse.json(
			{ error: 'Failed to create media item', details: insertError?.message ?? null },
			{ status: 500 }
		);
	}

	// app-media-items: skip the default user gallery; link directly to the required app gallery.
	if (bucketId === 'app-media-items') {
		const { error: appLinkError } = await supabase.from('gallery_media_items').insert({
			gallery_id: body.gallery_id as string,
			media_item_id: inserted.id,
			added_by: auth.user.id,
		} satisfies TablesInsert<'gallery_media_items'>);

		if (appLinkError) {
			return NextResponse.json(
				{ error: 'Failed to link media item to gallery', details: appLinkError.message },
				{ status: 500 }
			);
		}

		return NextResponse.json({ ok: true, media_item: inserted }, { status: 201 });
	}

	// media-items: look up (or create) the user's default uploads gallery, link to it,
	// and optionally also link to a user-selected gallery.
	const { data: defaultGalleryId, error: galleryError } = await supabase.rpc(
		'get_or_create_default_gallery',
		{ p_user_id: auth.user.id }
	);

	if (galleryError || !defaultGalleryId) {
		return NextResponse.json(
			{ error: 'Failed to get default gallery', details: galleryError?.message ?? null },
			{ status: 500 }
		);
	}

	const { error: linkError } = await supabase.from('gallery_media_items').insert({
		gallery_id: defaultGalleryId,
		media_item_id: inserted.id,
		added_by: auth.user.id,
	} satisfies TablesInsert<'gallery_media_items'>);

	if (linkError) {
		return NextResponse.json(
			{ error: 'Failed to link media item to default gallery', details: linkError.message },
			{ status: 500 }
		);
	}

	// Optionally link to an additional user-selected gallery.
	// Only attempted when a gallery_id is provided that differs from the default gallery
	// (the unique constraint on gallery_media_items prevents duplicate links).
	// Non-fatal: the upload and default-gallery link are already committed.
	if (body.gallery_id && body.gallery_id !== defaultGalleryId) {
		await supabase.from('gallery_media_items').insert({
			gallery_id: body.gallery_id,
			media_item_id: inserted.id,
			added_by: auth.user.id,
		} satisfies TablesInsert<'gallery_media_items'>);
	}

	return NextResponse.json(
		{ ok: true, media_item: inserted, default_gallery_id: defaultGalleryId },
		{ status: 201 }
	);
}
