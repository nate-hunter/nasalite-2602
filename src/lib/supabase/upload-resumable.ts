'use client';

import { storage_cache_control_seconds } from '@/lib/constants';
import { Upload as TusUpload } from 'tus-js-client';

type AllowedBucketId = 'media-items' | 'app-media-items';

/**
 * Uploads a file to Supabase Storage via the TUS resumable-upload protocol.
 * Used for video files where reliability over large payloads matters.
 *
 * Requires the caller to supply a valid Supabase access token — obtain it via
 * `supabase.auth.getSession()` in the calling component before invoking this.
 */
export async function upload_video_resumable_to_supabase({
	file,
	bucketId,
	filePath,
	accessToken,
	onProgress,
}: {
	file: File;
	bucketId: AllowedBucketId;
	filePath: string;
	accessToken: string;
	onProgress?: (percent: number) => void;
}): Promise<void> {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

	if (!supabaseUrl || !publishableKey) {
		throw new Error('Missing public Supabase environment variables for resumable upload.');
	}

	await new Promise<void>((resolve, reject) => {
		const upload = new TusUpload(file, {
			endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
			retryDelays: [0, 1000, 3000, 5000, 10000],
			chunkSize: 6 * 1024 * 1024,
			uploadDataDuringCreation: true,
			removeFingerprintOnSuccess: true,
			headers: {
				authorization: `Bearer ${accessToken}`,
				apikey: publishableKey,
				'x-upsert': 'false',
			},
			metadata: {
				bucketName: bucketId,
				objectName: filePath,
				contentType: file.type || 'application/octet-stream',
				cacheControl: storage_cache_control_seconds(bucketId),
			},
			onError: (err) => {
				reject(err instanceof Error ? err : new Error('Resumable upload failed.'));
			},
			onProgress: (bytesUploaded, bytesTotal) => {
				if (!bytesTotal) return;
				onProgress?.((bytesUploaded / bytesTotal) * 100);
			},
			onSuccess: () => resolve(),
		});

		void upload
			.findPreviousUploads()
			.then((previousUploads) => {
				if (previousUploads.length > 0) {
					upload.resumeFromPreviousUpload(previousUploads[0]);
				}
				upload.start();
			})
			.catch(() => {
				upload.start();
			});
	});
}
