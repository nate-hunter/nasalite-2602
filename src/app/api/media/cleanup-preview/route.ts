import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { imagekit, validateImageKitConfig } from '@/lib/imagekit/imagekit-server';

function parseImageKitFileId(body: unknown): string | null {
	if (!body || typeof body !== 'object') return null;
	const o = body as Record<string, unknown>;
	const raw =
		(typeof o.imagekitTempFileId === 'string' && o.imagekitTempFileId.trim()) ||
		(typeof o.imagekitFileId === 'string' && o.imagekitFileId.trim());
	return raw ? raw.trim() : null;
}

/** Only allow deleting HEIC temp previews uploaded under this folder (see `processQueuedMediaFile`). */
function isTempPreviewPath(filePath: string): boolean {
	const normalized = filePath.replace(/^\/+/, '');
	return normalized.startsWith('temp-previews/');
}

/**
 * Deletes a temporary ImageKit preview file (e.g. HEIC in `temp-previews/`).
 * @see https://docs.imagekit.io/api-reference/media-api/delete-file
 */
export async function POST(req: Request) {
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const fileId = parseImageKitFileId(body);
	if (!fileId) {
		return NextResponse.json(
			{ error: 'Missing or empty imagekitTempFileId (or imagekitFileId)' },
			{ status: 400 }
		);
	}

	const supabase = await createClient();
	const { data: auth, error: authError } = await supabase.auth.getUser();
	if (authError || !auth.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		validateImageKitConfig();
	} catch {
		return NextResponse.json({ error: 'ImageKit configuration error' }, { status: 500 });
	}

	try {
		const details = await imagekit.getFileDetails(fileId);
		if (!isTempPreviewPath(details.filePath)) {
			return NextResponse.json(
				{ error: 'Only files under temp-previews/ can be deleted via this endpoint' },
				{ status: 403 }
			);
		}

		await imagekit.deleteFile(fileId);
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ImageKit request failed';
		return NextResponse.json(
			{ error: 'Failed to delete preview', details: message },
			{ status: 502 }
		);
	}
}
