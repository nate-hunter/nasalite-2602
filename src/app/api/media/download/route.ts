/**
 * Media Download Proxy
 *
 * Streams a file from Supabase Storage back to the client with
 * Content-Disposition: attachment so the browser saves the file rather than
 * navigating to it.
 *
 * Why a proxy instead of a direct storage URL + <a download>?
 *   The `download` attribute is ignored by browsers for cross-origin URLs.
 *   Supabase Storage lives on a different origin from this app (different port
 *   in dev; different domain in production), so a server proxy is required.
 *   This route also serves as the foundation for downloading private
 *   (non-public) media items from the `media-items` bucket, which require
 *   service-role access and a user auth check.
 *
 * Usage:
 *   GET /api/media/download
 *     ?file_path=2026/04/uuid-photo.jpg   (relative path within the bucket)
 *     &bucket_id=app-media-items          (app-media-items | media-items)
 *     &filename=my-photo.jpg              (optional; suggested download name)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_BUCKETS = ['app-media-items', 'media-items'] as const;
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

function is_allowed_bucket(value: string): value is AllowedBucket {
	return (ALLOWED_BUCKETS as readonly string[]).includes(value);
}

/** Reject paths that try to escape the bucket root. */
function is_safe_path(file_path: string): boolean {
	if (file_path.startsWith('/')) return false;
	const segments = file_path.split('/');
	return !segments.some((seg) => seg === '..' || seg === '.');
}

/** Strip unsafe characters from the suggested download filename. */
function sanitize_filename(raw: string): string {
	const without_path = raw.split(/[/\\]/).pop() ?? 'file';
	const collapsed = without_path.trim().replace(/\s+/g, '-');
	const safe = collapsed.replace(/[^a-zA-Z0-9._-]+/g, '');
	const trimmed = safe.replace(/^[-_.]+|[-_.]+$/g, '');
	return trimmed.length > 0 ? trimmed.slice(0, 120) : 'file';
}

export async function GET(req: Request): Promise<Response> {
	const { searchParams } = new URL(req.url);
	const file_path = searchParams.get('file_path');
	const bucket_id = searchParams.get('bucket_id');
	const raw_filename = searchParams.get('filename');

	// ── 1. Validate required params ─────────────────────────────────────────
	if (!file_path || file_path.trim().length === 0) {
		return Response.json({ error: 'Missing required param: file_path' }, { status: 400 });
	}
	if (!bucket_id || bucket_id.trim().length === 0) {
		return Response.json({ error: 'Missing required param: bucket_id' }, { status: 400 });
	}
	if (!is_allowed_bucket(bucket_id)) {
		return Response.json(
			{ error: `Invalid bucket_id. Allowed values: ${ALLOWED_BUCKETS.join(', ')}` },
			{ status: 400 }
		);
	}
	if (!is_safe_path(file_path)) {
		return Response.json({ error: 'Invalid file_path' }, { status: 400 });
	}

	// ── 2. Auth gate for the private bucket ─────────────────────────────────
	//   Public bucket (app-media-items): no user auth required — the admin
	//   client fetches it on behalf of the server.
	//   Private bucket (media-items): caller must be authenticated.
	if (bucket_id === 'media-items') {
		const supabase = await createClient();
		const { data: auth, error: authError } = await supabase.auth.getUser();
		if (authError || !auth.user) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}
	}

	// ── 3. Download via admin client (service role; works for both buckets) ──
	const admin = createAdminClient();
	const { data: blob, error: downloadError } = await admin.storage
		.from(bucket_id)
		.download(file_path);

	if (downloadError || !blob) {
		console.error('[media/download] Supabase storage error:', downloadError?.message);
		return Response.json(
			{ error: 'Failed to retrieve file', details: downloadError?.message ?? null },
			{ status: 500 }
		);
	}

	// ── 4. Stream the file back with download headers ────────────────────────
	const fallback_filename = file_path.split('/').pop() ?? 'download';
	const download_filename = sanitize_filename(raw_filename ?? fallback_filename);
	const content_type = blob.type || 'application/octet-stream';
	const buffer = await blob.arrayBuffer();

	return new Response(buffer, {
		status: 200,
		headers: {
			'Content-Type': content_type,
			'Content-Disposition': `attachment; filename="${download_filename}"`,
			'Content-Length': String(buffer.byteLength),
			// Prevent the proxy response from being cached — downloads should
			// always reflect the current state of the file in storage.
			'Cache-Control': 'no-store',
		},
	});
}
