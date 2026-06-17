/**
 * Request Upload URL Endpoint
 *
 * Generates a secure signed URL for client-side uploads to Supabase Storage
 *
 * Flow:
 * 1. Client requests a signed URL with file metadata
 * 2. Server validates user authentication
 * 3. Server generates a structured file path with date organization
 * 4. Server creates a time-limited signed upload URL
 * 5. Client uploads file directly to Supabase using the signed URL
 * 6. Client calls /finalize-upload with the path and metadata
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TablesInsert } from '@/lib/supabase/database.types';

type AllowedBucketId = 'media-items' | 'app-media-items';

type RequestUploadUrlBody = {
	original_filename: TablesInsert<'media_items'>['original_filename'];
	mime_type: TablesInsert<'media_items'>['mime_type'];
	file_size: TablesInsert<'media_items'>['file_size'];
	/**
	 * Optional for now; defaults to the user-upload bucket.
	 * (We are not enforcing bucket/source rules here yet — that comes later.)
	 */
	bucket_id?: AllowedBucketId;
};

function isValidRequestBody(value: unknown): value is RequestUploadUrlBody {
	if (!value || typeof value !== 'object') return false;
	const v = value as Record<string, unknown>;

	if (typeof v.original_filename !== 'string' || v.original_filename.length === 0) return false;
	if (typeof v.mime_type !== 'string' || v.mime_type.length === 0) return false;

	// file_size is nullable in DB types; for uploads we require a number.
	if (typeof v.file_size !== 'number' || !Number.isFinite(v.file_size) || v.file_size <= 0)
		return false;

	if (typeof v.bucket_id === 'undefined') return true;
	return v.bucket_id === 'media-items' || v.bucket_id === 'app-media-items';
}

function sanitizeFilename(original: string) {
	// Avoid path traversal and keep URLs clean.
	const withoutPath = original.split(/[/\\]/).pop() ?? 'file';
	const collapsed = withoutPath.trim().replace(/\s+/g, '-');
	const safe = collapsed.replace(/[^a-zA-Z0-9._-]+/g, '');
	const trimmed = safe.replace(/^[-_.]+|[-_.]+$/g, '');
	return trimmed.length > 0 ? trimmed.slice(0, 120) : 'file';
}

export async function POST(req: Request) {
	// (1) Client requests a signed URL with file metadata
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!isValidRequestBody(body)) {
		return NextResponse.json(
			{
				error:
					'Invalid request body. Expected { original_filename, mime_type, file_size, bucket_id? }',
			},
			{ status: 400 }
		);
	}

	// (2) Server validates user authentication
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	if (error || !data.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const bucketId: AllowedBucketId = body.bucket_id ?? 'media-items';

	if (bucketId === 'app-media-items') {
		const { data: profile } = await supabase
			.from('user_profiles')
			.select('app_role')
			.eq('id', data.user.id)
			.single();

		if (profile?.app_role !== 'super_admin') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
	}

	// (3) Server generates a structured file path with date organization.
	// Path conventions (see migration 20260314200909 and media_items.file_path column comment):
	//   media-items:     users/{user_id}/{year}/{month}/{uuid}-{filename}
	//   app-media-items: {year}/{month}/{uuid}-{filename}  (no user segment; write gated by super_admin RLS)
	const now = new Date();
	const year = String(now.getUTCFullYear());
	const month = String(now.getUTCMonth() + 1).padStart(2, '0');
	const safeName = sanitizeFilename(body.original_filename);
	const objectName = `${crypto.randomUUID()}-${safeName}`;

	const file_path =
		bucketId === 'app-media-items'
			? `${year}/${month}/${objectName}`
			: `users/${data.user.id}/${year}/${month}/${objectName}`;

	// (4) Server creates a time-limited signed upload URL
	const { data: signed, error: signedError } = await supabase.storage
		.from(bucketId)
		.createSignedUploadUrl(file_path);

	if (signedError || !signed) {
		return NextResponse.json(
			{
				error: 'Failed to create signed upload URL',
				details: signedError?.message ?? null,
			},
			{ status: 500 }
		);
	}

	return NextResponse.json(
		{
			ok: true,
			bucket_id: bucketId,
			file_path,
			signed_url: signed.signedUrl,
			token: signed.token,
		},
		{ status: 200 }
	);
}
