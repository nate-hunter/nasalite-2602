import { parse as parseExif } from 'exifr';
import { sanitizeJsonForPostgres } from '@/utils/sanitize_json_for_postgres';

/** Matches `allowed_mime_types` on project storage buckets (see migrations). */
const ALLOWED_MIME_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/heic',
	'image/heif',
	'video/mp4',
	'video/mov',
	'video/avi',
	'video/quicktime',
]);

const MAX_PHOTO_FILE_BYTES = 10 * 1024 * 1024; // 10 MiB
const MAX_VIDEO_FILE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GiB

export type PreviewKind = 'image' | 'video';

/** Fields aligned with `media_items` EXIF/GPS columns; all optional when parse fails or is absent. */
export type ExtractedExifMetadata = {
	lat?: number;
	lon?: number;
	camera_make?: string;
	camera_model?: string;
	/** ISO 8601 when derivable from EXIF date fields. */
	date_taken?: string;
	/** JSON-serializable snapshot of the parsed EXIF payload for `media_items.exif_data`. */
	exif_data?: Record<string, unknown> | null;
};

export type ProcessQueuedMediaResult = {
	previewKind: PreviewKind;
	previewUrl?: string;
	imagekitTempFileId?: string;
	width?: number;
	height?: number;
} & ExtractedExifMetadata;

export type ProcessQueuedMediaCallbacks = {
	onProgress: (percent: number) => void;
};

function inferMimeType(file: File): string {
	if (file.type) return file.type;
	const ext = file.name.split('.').pop()?.toLowerCase();
	const map: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		heic: 'image/heic',
		heif: 'image/heif',
		mp4: 'video/mp4',
		mov: 'video/quicktime',
		avi: 'video/avi',
	};
	return ext && map[ext] ? map[ext] : '';
}

export function inferPreviewKind(file: File): PreviewKind {
	const mime = inferMimeType(file);
	if (mime.startsWith('video/')) return 'video';
	return 'image';
}

function assertAllowedFile(file: File): void {
	const mime = inferMimeType(file);
	if (!mime || !ALLOWED_MIME_TYPES.has(mime)) {
		throw new Error('This file type is not allowed. Use a supported photo or video format.');
	}

	const maxBytes = mime.startsWith('video/') ? MAX_VIDEO_FILE_BYTES : MAX_PHOTO_FILE_BYTES;
	if (file.size > maxBytes) {
		throw new Error(
			mime.startsWith('video/')
				? 'Video exceeds the maximum size of 5 GB.'
				: 'Photo exceeds the maximum size of 10 MB.'
		);
	}
}

function isHeicHeif(file: File): boolean {
	const mime = inferMimeType(file);
	if (mime === 'image/heic' || mime === 'image/heif') return true;

	const ext = file.name.split('.').pop()?.toLowerCase();
	return ext === 'heic' || ext === 'heif';
}

function probeImagePreview(objectUrl: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const width = img.naturalWidth;
			const height = img.naturalHeight;
			if (!width || !height) {
				reject(new Error('Could not read image dimensions.'));
				return;
			}
			resolve({ width, height });
		};
		img.onerror = () => {
			reject(
				new Error(
					'Could not generate an image preview. HEIC/HEIF often needs a preview pipeline (for example ImageKit) in browsers that do not decode them natively.'
				)
			);
		};
		img.src = objectUrl;
	});
}

function probeVideoPreview(objectUrl: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const video = document.createElement('video');
		video.preload = 'metadata';
		video.muted = true;
		video.playsInline = true;
		const cleanup = () => {
			video.removeAttribute('src');
			video.load();
		};
		video.onloadedmetadata = () => {
			const width = video.videoWidth;
			const height = video.videoHeight;
			cleanup();
			if (!width || !height) {
				reject(new Error('Could not read video dimensions.'));
				return;
			}
			resolve({ width, height });
		};
		video.onerror = () => {
			cleanup();
			reject(new Error('Could not load a video preview for this file.'));
		};
		video.src = objectUrl;
	});
}

function readFiniteNumber(obj: Record<string, unknown>, key: string): number | undefined {
	const v = obj[key];
	return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function readNonEmptyString(obj: Record<string, unknown>, key: string): string | undefined {
	const v = obj[key];
	return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}

function normalizeDateTaken(raw: unknown): string | undefined {
	if (raw == null) return undefined;
	if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
		return raw.toISOString();
	}
	if (typeof raw === 'string' || typeof raw === 'number') {
		const d = new Date(raw);
		if (!Number.isNaN(d.getTime())) return d.toISOString();
	}
	return undefined;
}

/**
 * Parses EXIF/GPS via exifr. Failures are non-fatal (empty partial result).
 */
async function extractExifMetadata(file: File): Promise<Partial<ExtractedExifMetadata>> {
	try {
		const parsed = await parseExif(file, { gps: true, exif: true, iptc: true });
		if (!parsed || typeof parsed !== 'object') return {};

		const o = parsed as Record<string, unknown>;
		const out: Partial<ExtractedExifMetadata> = {};

		const lat = readFiniteNumber(o, 'latitude');
		const lon = readFiniteNumber(o, 'longitude');
		if (lat !== undefined) out.lat = lat;
		if (lon !== undefined) out.lon = lon;

		const make = readNonEmptyString(o, 'Make');
		const model = readNonEmptyString(o, 'Model');
		if (make) out.camera_make = make;
		if (model) out.camera_model = model;

		const dateTaken = normalizeDateTaken(
			o.DateTimeOriginal ?? o.CreateDate ?? o.DateTime ?? o.ModifyDate
		);
		if (dateTaken) out.date_taken = dateTaken;

		try {
			const serialized = JSON.parse(JSON.stringify(parsed)) as Record<string, unknown>;
			out.exif_data = sanitizeJsonForPostgres(serialized) as Record<string, unknown>;
		} catch {
			out.exif_data = null;
		}

		return out;
	} catch {
		return {};
	}
}

function sanitizeFilenameForImageKit(name: string): string {
	// ImageKit supports alphanumerics and '.' '-' in v1; docs say other chars are replaced with '_'.
	return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

function buildTempPreviewFilename(file: File): string {
	const safeOriginal = sanitizeFilenameForImageKit(file.name);
	// Keep the extension so ImageKit applies correct processing.
	return `${Date.now()}-${crypto.randomUUID()}-${safeOriginal}`;
}

async function uploadHeicPreviewToImageKitTemp(
	file: File,
	callbacks: ProcessQueuedMediaCallbacks
): Promise<{ previewUrl: string; imagekitTempFileId?: string; width?: number; height?: number }> {
	const { onProgress } = callbacks;
	onProgress(60);

	const authRes = await fetch('/api/imagekit-auth', {
		method: 'GET',
		// Include cookies for Supabase session auth (same-origin request).
		credentials: 'include',
	});
	if (!authRes.ok) {
		throw new Error('Failed to authenticate with ImageKit for HEIC preview.');
	}
	const auth = (await authRes.json()) as {
		token: string;
		expire: number;
		signature: string;
		publicKey?: string;
	};

	if (!auth.publicKey) {
		throw new Error('ImageKit auth response missing publicKey.');
	}

	const fileName = buildTempPreviewFilename(file);

	const form = new FormData();
	form.append('file', file);
	form.append('fileName', fileName);
	form.append('publicKey', auth.publicKey);
	form.append('signature', auth.signature);
	form.append('expire', String(auth.expire));
	form.append('token', auth.token);
	form.append('useUniqueFileName', 'false');
	form.append('folder', 'temp-previews/');

	// We want a URL we can show immediately in the UI.
	form.append('isPrivateFile', 'false');
	form.append('isPublished', 'true');

	// Ensure these are included in the response.
	form.append('responseFields', 'fileId,url,width,height');

	const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
		method: 'POST',
		headers: { Accept: 'application/json' },
		body: form,
	});

	if (!res.ok) {
		throw new Error('Failed to upload HEIC preview to ImageKit.');
	}

	const json = (await res.json()) as {
		fileId?: string;
		url?: string;
		width?: number;
		height?: number;
	};

	if (!json.url) {
		throw new Error('ImageKit HEIC upload succeeded but no preview URL was returned.');
	}

	onProgress(100);
	return {
		previewUrl: json.url,
		imagekitTempFileId: json.fileId,
		width: json.width,
		height: json.height,
	};
}

/**
 * Validates the file, optionally reads EXIF, and verifies a browser preview can be produced.
 * Progress is reported roughly by stage (0–100).
 */
export async function processQueuedMediaFile(
	file: File,
	objectUrl: string,
	callbacks: ProcessQueuedMediaCallbacks
): Promise<ProcessQueuedMediaResult> {
	const { onProgress } = callbacks;
	const previewKind = inferPreviewKind(file);

	onProgress(8);
	assertAllowedFile(file);

	onProgress(22);
	const exifMeta = await extractExifMetadata(file);

	// For HEIC/HEIF we do a guaranteed preview pipeline using ImageKit temp uploads.
	if (isHeicHeif(file)) {
		const heicResult = await uploadHeicPreviewToImageKitTemp(file, callbacks);
		return {
			...exifMeta,
			previewKind: 'image',
			previewUrl: heicResult.previewUrl,
			imagekitTempFileId: heicResult.imagekitTempFileId,
			width: heicResult.width,
			height: heicResult.height,
		};
	}

	if (previewKind === 'video') {
		onProgress(55);
		const { width, height } = await probeVideoPreview(objectUrl);
		onProgress(100);
		return { ...exifMeta, previewKind: 'video', width, height };
	}

	onProgress(55);
	const { width, height } = await probeImagePreview(objectUrl);
	onProgress(100);
	return { ...exifMeta, previewKind: 'image', width, height };
}
