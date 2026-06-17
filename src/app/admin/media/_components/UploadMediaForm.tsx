'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/ui/Icon';
import { Button } from '@/ui/Button/Button';
import { GallerySelector, use_galleries } from '@/ui/GallerySelector';
import { storage_cache_control_seconds } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { upload_video_resumable_to_supabase } from '@/lib/supabase/upload-resumable';
import Dropzone from '@/app/media/upload/_components/Dropzone';
import {
	inferPreviewKind,
	processQueuedMediaFile,
	type ExtractedExifMetadata,
	type PreviewKind,
} from '@/app/media/upload/_lib/processQueuedMediaFile';
import styles from '@/app/media/upload/media-upload.module.css';

type ProcessStatus = 'processing' | 'ready' | 'failed';
type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'failed';

type QueuedFile = {
	id: string;
	file: File;
	title: string;
	objectUrl: string;
	previewUrl: string;
	previewKind: PreviewKind;
	processStatus: ProcessStatus;
	processProgress: number;
	processError?: string;
	imagekitTempFileId?: string;
	uploadStatus: UploadStatus;
	uploadProgress: number;
	uploadError?: string;
	uploadedFilePath?: string;
} & ExtractedExifMetadata;

export default function UploadMediaForm() {
	const [queued_files, set_queued_files] = useState<Array<QueuedFile>>([]);
	const [editing_title_id, set_editing_title_id] = useState<string | null>(null);

	const { galleries, galleries_loading } = use_galleries({ filter_app_galleries: true });
	const [selected_gallery_id, set_selected_gallery_id] = useState<string | null>(null);

	const queued_files_ref = useRef<Array<QueuedFile>>([]);
	useEffect(() => {
		queued_files_ref.current = queued_files;
	}, [queued_files]);

	const selected_gallery_id_ref = useRef<string | null>(null);
	useEffect(() => {
		selected_gallery_id_ref.current = selected_gallery_id;
	}, [selected_gallery_id]);

	// Revoke object URLs on unmount to avoid memory leaks.
	useEffect(() => {
		return () => {
			for (const item of queued_files_ref.current) {
				URL.revokeObjectURL(item.objectUrl);
			}
		};
	}, []);

	useEffect(() => {
		if (editing_title_id && !queued_files.some((q) => q.id === editing_title_id)) {
			set_editing_title_id(null);
		}
	}, [editing_title_id, queued_files]);

	const start_processing_for_items = useCallback((items: Array<QueuedFile>) => {
		for (const item of items) {
			const { id, file, objectUrl } = item;
			void (async () => {
				try {
					const result = await processQueuedMediaFile(file, objectUrl, {
						onProgress: (percent) => {
							set_queued_files((prev) => {
								if (!prev.some((x) => x.id === id)) return prev;
								return prev.map((x) =>
									x.id === id ? { ...x, processStatus: 'processing', processProgress: percent } : x
								);
							});
						},
					});
					set_queued_files((prev) => {
						if (!prev.some((x) => x.id === id)) return prev;
						return prev.map((x) =>
							x.id === id
								? {
										...x,
										processStatus: 'ready',
										processProgress: 100,
										previewKind: result.previewKind,
										previewUrl: result.previewUrl ?? x.previewUrl,
										imagekitTempFileId: result.imagekitTempFileId,
										processError: undefined,
										lat: result.lat,
										lon: result.lon,
										camera_make: result.camera_make,
										camera_model: result.camera_model,
										date_taken: result.date_taken,
										exif_data: result.exif_data,
									}
								: x
						);
					});
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : 'Processing failed.';
					set_queued_files((prev) => {
						if (!prev.some((x) => x.id === id)) return prev;
						return prev.map((x) =>
							x.id === id
								? { ...x, processStatus: 'failed', processProgress: 0, processError: message }
								: x
						);
					});
				}
			})();
		}
	}, []);

	const handle_files_selected = (files: Array<File>) => {
		const next_items: Array<QueuedFile> = files.map((file) => ({
			id: crypto.randomUUID(),
			file,
			title: get_default_title_from_filename(file.name),
			objectUrl: URL.createObjectURL(file),
			previewUrl: URL.createObjectURL(file),
			previewKind: inferPreviewKind(file),
			processStatus: 'processing',
			processProgress: 0,
			uploadStatus: 'idle',
			uploadProgress: 0,
		}));
		set_queued_files((prev) => [...prev, ...next_items]);
		start_processing_for_items(next_items);
	};

	const handle_remove_file = (file_id: string) => {
		set_queued_files((prev) => {
			const target = prev.find((item) => item.id === file_id);
			if (target) URL.revokeObjectURL(target.objectUrl);
			return prev.filter((item) => item.id !== file_id);
		});
	};

	const handle_title_change = (file_id: string, next_title: string) => {
		set_queued_files((prev) =>
			prev.map((item) => (item.id === file_id ? { ...item, title: next_title } : item))
		);
	};

	const handle_clear_all = () => {
		set_queued_files((prev) => {
			for (const item of prev) URL.revokeObjectURL(item.objectUrl);
			return [];
		});
	};

	const handle_upload_ready_files = useCallback(async () => {
		const supabase = createClient();
		const ready = queued_files_ref.current.filter(
			(f) =>
				f.processStatus === 'ready' && (f.uploadStatus === 'idle' || f.uploadStatus === 'failed')
		);

		for (const item of ready) {
			set_queued_files((prev) =>
				prev.map((x) =>
					x.id === item.id
						? { ...x, uploadStatus: 'uploading', uploadProgress: 0, uploadError: undefined }
						: x
				)
			);

			try {
				// 1) Request a signed upload URL for the app-media-items bucket.
				const signed_res = await fetch('/api/media/request-upload-url', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						original_filename: item.file.name,
						mime_type: item.file.type || 'application/octet-stream',
						file_size: item.file.size,
						bucket_id: 'app-media-items',
					}),
				});

				if (!signed_res.ok) {
					const payload = (await signed_res.json().catch(() => null)) as {
						error?: string;
					} | null;
					throw new Error(
						payload?.error ?? `request-upload-url failed (${signed_res.status})`
					);
				}

				const signed_payload = (await signed_res.json()) as {
					ok: true;
					bucket_id: 'app-media-items';
					file_path: string;
					signed_url: string;
					token: string;
				};

				// 2) Upload bytes. Videos use TUS for reliability; photos use the signed URL.
				if (item.previewKind === 'video') {
					const {
						data: { session },
						error: session_error,
					} = await supabase.auth.getSession();

					if (session_error || !session?.access_token) {
						throw new Error('Could not get an authenticated session for resumable upload.');
					}

					await upload_video_resumable_to_supabase({
						file: item.file,
						bucketId: signed_payload.bucket_id,
						filePath: signed_payload.file_path,
						accessToken: session.access_token,
						onProgress: (percent) => {
							set_queued_files((prev) =>
								prev.map((x) =>
									x.id === item.id && x.uploadStatus === 'uploading'
										? { ...x, uploadProgress: percent }
										: x
								)
							);
						},
					});
				} else {
					const { error: upload_error } = await supabase.storage
						.from(signed_payload.bucket_id)
						.uploadToSignedUrl(signed_payload.file_path, signed_payload.token, item.file, {
							contentType: item.file.type || 'application/octet-stream',
							cacheControl: storage_cache_control_seconds(signed_payload.bucket_id),
						});

					if (upload_error) throw new Error(upload_error.message);
				}

				// 3) Finalize: create DB record and link to the selected app gallery.
				const finalize_res = await fetch('/api/media/finalize-upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						bucket_id: signed_payload.bucket_id,
						file_path: signed_payload.file_path,
						title: item.title,
						original_filename: item.file.name,
						mime_type: item.file.type || 'application/octet-stream',
						file_size: item.file.size,
						lat: item.lat,
						lon: item.lon,
						camera_make: item.camera_make,
						camera_model: item.camera_model,
						date_taken: item.date_taken,
						exif_data: item.exif_data ?? null,
						gallery_id: selected_gallery_id_ref.current,
					}),
				});

				if (!finalize_res.ok) {
					const payload = (await finalize_res.json().catch(() => null)) as {
						error?: string;
					} | null;
					throw new Error(
						payload?.error ?? `finalize-upload failed (${finalize_res.status})`
					);
				}

				// 4) Clean up the HEIC temp preview from ImageKit (fire-and-forget).
				if (item.imagekitTempFileId) {
					void fetch('/api/media/cleanup-preview', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ imagekitTempFileId: item.imagekitTempFileId }),
					}).catch(() => {});
				}

				set_queued_files((prev) =>
					prev.map((x) =>
						x.id === item.id
							? {
									...x,
									uploadStatus: 'uploaded',
									uploadProgress: 100,
									uploadedFilePath: signed_payload.file_path,
									uploadError: undefined,
								}
							: x
					)
				);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Upload failed.';
				set_queued_files((prev) =>
					prev.map((x) =>
						x.id === item.id
							? { ...x, uploadStatus: 'failed', uploadProgress: 0, uploadError: message }
							: x
					)
				);
			}
		}
	}, []);

	const ready_file_count = queued_files.filter((f) => f.processStatus === 'ready').length;
	const total_queued_bytes = queued_files.reduce((sum, item) => sum + item.file.size, 0);
	const can_upload = ready_file_count > 0 && selected_gallery_id !== null;

	return (
		<div className={styles.uploadPanel}>
			<Dropzone onFilesSelected={handle_files_selected} />

			<div className={styles.filesBar}>
				<p
					className={styles.filesCount}
					aria-live="polite"
					aria-label={`${queued_files.length} file${queued_files.length === 1 ? '' : 's'}${queued_files.length > 0 ? `, ${format_bytes(total_queued_bytes)} total` : ''}`}
				>
					Files ({queued_files.length})
					{queued_files.length > 0 && (
						<span style={{ color: 'var(--color-secondary-500)' }}>
							{' '}
							• {format_bytes(total_queued_bytes)}
						</span>
					)}
				</p>
				<GallerySelector
					galleries={galleries}
					galleries_loading={galleries_loading}
					selected_gallery_id={selected_gallery_id}
					on_change={set_selected_gallery_id}
					required
				/>
			</div>

			{queued_files.length > 0 && (
				<ul className={styles.fileList}>
					{queued_files.map(
						({
							id,
							file,
							title,
							previewUrl,
							previewKind,
							processStatus,
							processProgress,
							processError,
							uploadStatus,
							uploadProgress,
							uploadError,
						}) => (
							<li key={id} className={styles.fileItem} aria-busy={processStatus === 'processing'}>
								<div className={styles.previewWrap}>
									{previewKind === 'video' ? (
										<video
											className={styles.preview}
											src={previewUrl}
											muted
											playsInline
											preload="metadata"
											aria-label={`Preview of ${file.name}`}
										/>
									) : (
										<img className={styles.preview} src={previewUrl} alt={file.name} />
									)}
								</div>

								<div className={styles.fileMeta}>
									{editing_title_id === id ? (
										<input
											type="text"
											value={title}
											autoFocus
											className={styles.fileNameInput}
											aria-label={`Edit title for ${file.name}`}
											onChange={(e) => handle_title_change(id, e.target.value)}
											onBlur={() => set_editing_title_id(null)}
										/>
									) : (
										<button
											type="button"
											className={styles.fileNameButton}
											onClick={() => set_editing_title_id(id)}
										>
											{title}
										</button>
									)}
									<p className={styles.fileSubtext}>{get_file_type_label(file)}</p>
									<p className={styles.fileSubtext}>{format_bytes(file.size)}</p>

									{processStatus === 'processing' && (
										<div className={styles.processBlock}>
											<span className={styles.processStatusLabel}>Processing</span>
											<div
												className={styles.progressTrack}
												role="progressbar"
												aria-valuemin={0}
												aria-valuemax={100}
												aria-valuenow={Math.round(processProgress)}
												aria-label={`Processing ${file.name}`}
											>
												<div
													className={styles.progressFill}
													style={{
														width: `${Math.min(100, Math.max(0, processProgress))}%`,
													}}
												/>
											</div>
										</div>
									)}
									{processStatus === 'ready' && (
										<p className={styles.statusReady}>Ready</p>
									)}
									{processStatus === 'failed' && (
										<div className={styles.statusFailedBlock}>
											<p className={styles.statusFailed}>Processing failed</p>
											{processError && (
												<p className={styles.processError}>{processError}</p>
											)}
										</div>
									)}

									{uploadStatus === 'uploading' && (
										<div className={styles.processBlock}>
											<span className={styles.processStatusLabel}>
												Uploading ({Math.round(uploadProgress)}%)
											</span>
											<div
												className={styles.progressTrack}
												role="progressbar"
												aria-valuemin={0}
												aria-valuemax={100}
												aria-valuenow={Math.round(uploadProgress)}
												aria-label={`Uploading ${file.name}`}
											>
												<div
													className={styles.progressFill}
													style={{
														width: `${Math.min(100, Math.max(0, uploadProgress))}%`,
													}}
												/>
											</div>
										</div>
									)}
									{uploadStatus === 'uploaded' && (
										<p className={styles.statusReady}>Uploaded</p>
									)}
									{uploadStatus === 'failed' && (
										<div className={styles.statusFailedBlock}>
											<p className={styles.statusFailed}>Upload failed</p>
											{uploadError && (
												<p className={styles.processError}>{uploadError}</p>
											)}
										</div>
									)}
								</div>

								<button
									type="button"
									className={styles.removeButton}
									aria-label={`Remove ${file.name}`}
									onClick={() => handle_remove_file(id)}
								>
									<CloseIcon size={16} />
								</button>
							</li>
						)
					)}
				</ul>
			)}

			<div className={styles.uploadActions}>
				<div className={styles.uploadActionsPair}>
					<Button
						variant="primary"
						disabled={!can_upload}
						className={styles.uploadActionButton}
						onClick={handle_upload_ready_files}
					>
						UPLOAD ({ready_file_count}) FILES
					</Button>
					<Button
						variant="secondary"
						disabled={queued_files.length === 0}
						className={styles.uploadActionButton}
						onClick={handle_clear_all}
					>
						CLEAR ALL
					</Button>
				</div>
			</div>
		</div>
	);
}

function get_file_type_label(file: File): string {
	if (file.type) return file.type;
	const extension = file.name.split('.').pop();
	return extension ? extension.toUpperCase() : 'Unknown file type';
}

function format_bytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const base = 1024;
	const unit_index = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
	const value = bytes / base ** unit_index;
	return `${value.toFixed(unit_index === 0 ? 0 : 1)} ${units[unit_index]}`;
}

function get_default_title_from_filename(filename: string): string {
	const parts = filename.split('.');
	if (parts.length <= 1) return filename;
	parts.pop();
	return parts.join('.');
}
