'use client';

import React, { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CloseIcon } from '@/ui/Icon';
import { Button } from '@/ui/Button/Button';
import { GallerySelector, use_galleries, type GalleryOption } from '@/ui/GallerySelector';
import { storage_cache_control_seconds } from '@/lib/constants';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';
import { upload_video_resumable_to_supabase } from '@/lib/supabase/upload-resumable';
import Dropzone from './_components/Dropzone';
import {
	inferPreviewKind,
	processQueuedMediaFile,
	type ExtractedExifMetadata,
	type PreviewKind,
} from './_lib/processQueuedMediaFile';
import { createSlugCandidate } from '@/utils/slug';
import styles from './media-upload.module.css';

type TabId = 'upload' | 'gallery';
type ProcessStatus = 'processing' | 'ready' | 'failed';
type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'failed';

type QueuedFile = {
	id: string;
	file: File;
	title: string;
	// Blob object URL for browser preview and cleanup.
	objectUrl: string;
	// Display URL. Starts as objectUrl, but can be replaced (e.g. HEIC -> ImageKit temp URL).
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

export default function MediaUploadPage() {
	const [activeTab, setActiveTab] = useState<TabId>('upload');
	const [queuedFiles, setQueuedFiles] = useState<Array<QueuedFile>>([]);

	const { galleries, galleries_loading } = use_galleries({ filter_app_galleries: false });
	const [selected_gallery_id, set_selected_gallery_id] = useState<string | null>(null);

	const queuedFilesRef = useRef<Array<QueuedFile>>([]);
	useEffect(() => {
		queuedFilesRef.current = queuedFiles;
	}, [queuedFiles]);

	const selected_gallery_id_ref = useRef<string | null>(null);
	useEffect(() => {
		selected_gallery_id_ref.current = selected_gallery_id;
	}, [selected_gallery_id]);

	useEffect(() => {
		return () => {
			for (const item of queuedFilesRef.current) {
				URL.revokeObjectURL(item.objectUrl);
			}
		};
	}, []);

	const start_processing_for_items = useCallback((items: Array<QueuedFile>) => {
		for (const item of items) {
			const { id, file, objectUrl } = item;
			void (async () => {
				try {
					const result = await processQueuedMediaFile(file, objectUrl, {
						onProgress: (percent) => {
							setQueuedFiles((prev) => {
								if (!prev.some((x) => x.id === id)) return prev;
								return prev.map((x) =>
									x.id === id ? { ...x, processStatus: 'processing', processProgress: percent } : x
								);
							});
						},
					});
					setQueuedFiles((prev) => {
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
					setQueuedFiles((prev) => {
						if (!prev.some((x) => x.id === id)) return prev;
						return prev.map((x) =>
							x.id === id
								? {
										...x,
										processStatus: 'failed',
										processProgress: 0,
										processError: message,
									}
								: x
						);
					});
				}
			})();
		}
	}, []);

	const handle_files_selected = (files: Array<File>) => {
		const nextItems: Array<QueuedFile> = files.map((file) => ({
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
		setQueuedFiles((prev) => [...prev, ...nextItems]);
		start_processing_for_items(nextItems);
	};

	const handle_remove_file = (fileId: string) => {
		setQueuedFiles((prev) => {
			const target = prev.find((item) => item.id === fileId);
			if (target) URL.revokeObjectURL(target.objectUrl);
			const next = prev.filter((item) => item.id !== fileId);
			return next;
		});
	};

	const handle_title_change = (fileId: string, nextTitle: string) => {
		setQueuedFiles((prev) =>
			prev.map((item) => (item.id === fileId ? { ...item, title: nextTitle } : item))
		);
	};

	const handle_clear_all = () => {
		setQueuedFiles((prev) => {
			for (const item of prev) {
				URL.revokeObjectURL(item.objectUrl);
			}
			return [];
		});
	};

	const handle_upload_ready_files = useCallback(async () => {
		const supabase = createBrowserSupabaseClient();
		const ready = queuedFilesRef.current.filter(
			(f) =>
				f.processStatus === 'ready' && (f.uploadStatus === 'idle' || f.uploadStatus === 'failed')
		);

		for (const item of ready) {
			setQueuedFiles((prev) =>
				prev.map((x) =>
					x.id === item.id
						? { ...x, uploadStatus: 'uploading', uploadProgress: 0, uploadError: undefined }
						: x
				)
			);

			try {
				// 1) Ask server for signed upload URL + token + path.
				const signedRes = await fetch('/api/media/request-upload-url', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						original_filename: item.file.name,
						mime_type: item.file.type || 'application/octet-stream',
						file_size: item.file.size,
						bucket_id: 'media-items',
					}),
				});

				if (!signedRes.ok) {
					const payload = (await signedRes.json().catch(() => null)) as { error?: string } | null;
					throw new Error(payload?.error ?? `request-upload-url failed (${signedRes.status})`);
				}

				const signedPayload = (await signedRes.json()) as {
					ok: true;
					bucket_id: 'media-items';
					file_path: string;
					signed_url: string;
					token: string;
				};

				// 2) Upload bytes to Storage.
				// Videos use resumable TUS uploads for reliability on larger files.
				if (item.previewKind === 'video') {
					const {
						data: { session },
						error: sessionError,
					} = await supabase.auth.getSession();

					if (sessionError || !session?.access_token) {
						throw new Error('Could not get an authenticated session for resumable upload.');
					}

					await upload_video_resumable_to_supabase({
						file: item.file,
						bucketId: signedPayload.bucket_id,
						filePath: signedPayload.file_path,
						accessToken: session.access_token,
						onProgress: (percent) => {
							setQueuedFiles((prev) =>
								prev.map((x) =>
									x.id === item.id && x.uploadStatus === 'uploading'
										? { ...x, uploadProgress: percent }
										: x
								)
							);
						},
					});
				} else {
					// Keep signed upload flow for non-video files.
					const { error: uploadError } = await supabase.storage
						.from(signedPayload.bucket_id)
						.uploadToSignedUrl(signedPayload.file_path, signedPayload.token, item.file, {
							contentType: item.file.type || 'application/octet-stream',
							cacheControl: storage_cache_control_seconds(signedPayload.bucket_id),
						});

					if (uploadError) throw new Error(uploadError.message);
				}

				// 3) Finalize: create DB record + link to default gallery.
				const finalizeRes = await fetch('/api/media/finalize-upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						bucket_id: signedPayload.bucket_id,
						file_path: signedPayload.file_path,
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
						gallery_id: selected_gallery_id_ref.current ?? undefined,
					}),
				});

				if (!finalizeRes.ok) {
					const payload = (await finalizeRes.json().catch(() => null)) as { error?: string } | null;
					throw new Error(payload?.error ?? `finalize-upload failed (${finalizeRes.status})`);
				}

				if (item.imagekitTempFileId) {
					void fetch('/api/media/cleanup-preview', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ imagekitTempFileId: item.imagekitTempFileId }),
					}).catch(() => {});
				}

				setQueuedFiles((prev) =>
					prev.map((x) =>
						x.id === item.id
							? {
									...x,
									uploadStatus: 'uploaded',
									uploadProgress: 100,
									uploadedFilePath: signedPayload.file_path,
									uploadError: undefined,
								}
							: x
					)
				);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Upload failed.';
				setQueuedFiles((prev) =>
					prev.map((x) =>
						x.id === item.id
							? { ...x, uploadStatus: 'failed', uploadProgress: 0, uploadError: message }
							: x
					)
				);
			}
		}
	}, []);

	return (
		<div>
			<h2>Media Upload Page...</h2>

			<div>
				<div className={styles.tabsShell}>
					<nav
						className={styles.tabsRow}
						role="tablist"
						aria-label="Choose upload or create gallery"
					>
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === 'upload'}
							className={activeTab === 'upload' ? styles.tabActive : styles.tab}
							onClick={() => setActiveTab('upload')}
						>
							Upload media
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === 'gallery'}
							className={activeTab === 'gallery' ? styles.tabActive : styles.tab}
							onClick={() => setActiveTab('gallery')}
						>
							Create gallery
						</button>
					</nav>
				</div>

				<div role="tabpanel" className={styles.tabPanel}>
					{activeTab === 'upload' ? (
						<MediaUpload
							queuedFiles={queuedFiles}
							onFilesSelected={handle_files_selected}
							onRemoveFile={handle_remove_file}
							onTitleChange={handle_title_change}
							onClearAll={handle_clear_all}
							onUploadReadyFiles={handle_upload_ready_files}
							readyFileCount={queuedFiles.filter((f) => f.processStatus === 'ready').length}
							galleries={galleries}
							galleries_loading={galleries_loading}
							selected_gallery_id={selected_gallery_id}
							on_gallery_change={set_selected_gallery_id}
							on_switch_to_create_gallery={() => setActiveTab('gallery')}
						/>
					) : (
						<AddGallery />
					)}
				</div>
			</div>
		</div>
	);
}

type MediaUploadProps = {
	queuedFiles: Array<QueuedFile>;
	onFilesSelected: (files: Array<File>) => void;
	onRemoveFile: (id: string) => void;
	onTitleChange: (id: string, title: string) => void;
	onClearAll: () => void;
	onUploadReadyFiles: () => void | Promise<void>;
	readyFileCount: number;
	galleries: Array<GalleryOption>;
	galleries_loading: boolean;
	selected_gallery_id: string | null;
	on_gallery_change: (id: string | null) => void;
	on_switch_to_create_gallery: () => void;
};

function MediaUpload({
	queuedFiles,
	onFilesSelected,
	onRemoveFile,
	onTitleChange,
	onClearAll,
	onUploadReadyFiles,
	readyFileCount,
	galleries,
	galleries_loading,
	selected_gallery_id,
	on_gallery_change,
	on_switch_to_create_gallery,
}: MediaUploadProps) {
	const [editingTitleId, setEditingTitleId] = useState<string | null>(null);

	useEffect(() => {
		if (editingTitleId && !queuedFiles.some((q) => q.id === editingTitleId)) {
			setEditingTitleId(null);
		}
	}, [editingTitleId, queuedFiles]);

	const totalQueuedBytes = queuedFiles.reduce((sum, item) => sum + item.file.size, 0);

	return (
		<div className={styles.uploadPanel}>
			<Dropzone onFilesSelected={onFilesSelected} />
			{/* <div> */}
			{/* <p
				className={styles.filesCount}
				aria-live="polite"
				aria-label={`${queuedFiles.length} file${queuedFiles.length === 1 ? '' : 's'}, ${format_bytes(totalQueuedBytes)} total`}
			>
				Files ({queuedFiles.length}) • {format_bytes(totalQueuedBytes)}
			</p> */}
			{/* <p
					className={styles.filesCount}
					aria-live="polite"
					aria-label={`${queuedFiles.length} file${queuedFiles.length === 1 ? '' : 's'}, ${format_bytes(totalQueuedBytes)} total`}
				>
					Files ({queuedFiles.length})
				</p>
				<p className={styles.fileSubtext}>{format_bytes(totalQueuedBytes)}</p> */}
			{/* </div> */}

			<div className={styles.filesBar}>
				<p
					className={styles.filesCount}
					aria-live="polite"
					aria-label={`${queuedFiles.length} file${queuedFiles.length === 1 ? '' : 's'}, ${format_bytes(totalQueuedBytes)} total`}
				>
					Files ({queuedFiles.length}){' '}
					{queuedFiles.length > 0 && (
						<span style={{ color: 'var(--color-secondary-500)' }}>
							{' '}
							• {format_bytes(totalQueuedBytes)}
						</span>
					)}
				</p>
				<GallerySelector
					galleries={galleries}
					galleries_loading={galleries_loading}
					selected_gallery_id={selected_gallery_id}
					on_change={on_gallery_change}
					on_switch_to_create_gallery={on_switch_to_create_gallery}
				/>
			</div>

			{queuedFiles.length > 0 ? (
				<ul className={styles.fileList}>
					{queuedFiles.map(
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
									{editingTitleId === id ? (
										<input
											type="text"
											value={title}
											autoFocus
											className={styles.fileName}
											aria-label={`Edit title for ${file.name}`}
											onChange={(e) => onTitleChange(id, e.target.value)}
											onBlur={() => setEditingTitleId(null)}
											style={{
												border: 0,
												borderBottom: '1px solid var(--color-primary-400)',
												background: 'transparent',
												outline: 'none',
												width: '100%',
												padding: 0,
											}}
										/>
									) : (
										<button
											type="button"
											className={styles.fileName}
											onClick={() => setEditingTitleId(id)}
											style={{
												border: 0,
												padding: 0,
												background: 'none',
												textAlign: 'left',
												width: '100%',
												cursor: 'pointer',
												// cursor: 'text',
											}}
										>
											{title}
										</button>
									)}
									<p className={styles.fileSubtext}>{get_file_type_label(file)}</p>
									<p className={styles.fileSubtext}>{format_bytes(file.size)}</p>

									{processStatus === 'processing' ? (
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
													style={{ width: `${Math.min(100, Math.max(0, processProgress))}%` }}
												/>
											</div>
										</div>
									) : null}
									{processStatus === 'ready' ? <p className={styles.statusReady}>Ready</p> : null}
									{processStatus === 'failed' ? (
										<div className={styles.statusFailedBlock}>
											<p className={styles.statusFailed}>Failed</p>
											{processError ? <p className={styles.processError}>{processError}</p> : null}
										</div>
									) : null}

									{uploadStatus === 'uploading' ? (
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
													style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
												/>
											</div>
										</div>
									) : null}
									{uploadStatus === 'uploaded' ? (
										<p className={styles.statusReady}>Uploaded</p>
									) : null}
									{uploadStatus === 'failed' ? (
										<div className={styles.statusFailedBlock}>
											<p className={styles.statusFailed}>Upload failed</p>
											{uploadError ? <p className={styles.processError}>{uploadError}</p> : null}
										</div>
									) : null}
								</div>
								<button
									type="button"
									className={styles.removeButton}
									aria-label={`Remove ${file.name}`}
									onClick={() => onRemoveFile(id)}
								>
									<CloseIcon size={16} />
								</button>
							</li>
						)
					)}
				</ul>
			) : null}

			<div className={styles.uploadActions}>
				<div className={styles.uploadActionsPair}>
					<Button
						variant="primary"
						disabled={readyFileCount === 0}
						className={styles.uploadActionButton}
						onClick={onUploadReadyFiles}
					>
						UPLOAD ({readyFileCount}) FILES
					</Button>
					<Button
						variant="secondary"
						disabled={queuedFiles.length === 0}
						className={styles.uploadActionButton}
						onClick={onClearAll}
					>
						CLEAR ALL
					</Button>
				</div>
				<p className={styles.consentNotice}>
					By uploading, you confirm that you have the right to share these photos and videos, and
					that you consent to Lisa and Nate keeping them as part of their memories collection.
				</p>
			</div>
		</div>
	);
}

function AddGallery() {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const isSubmitDisabled = isSubmitting || title.trim().length === 0;

	const handle_submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmedTitle = title.trim();
		const trimmedDescription = description.trim();

		if (!trimmedTitle) {
			setErrorMessage('Title is required.');
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		try {
			const supabase = createBrowserSupabaseClient();
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				throw new Error(userError?.message ?? 'You must be signed in to create a gallery.');
			}

			let insertErrorMessage: string | null = null;

			for (let attempt = 0; attempt < 6; attempt += 1) {
				const nextSlug = createSlugCandidate(trimmedTitle, attempt);
				const { error: insertError } = await supabase.from('galleries').insert({
					title: trimmedTitle,
					slug: nextSlug,
					description: trimmedDescription || null,
					creator_id: user.id,
				});

				if (!insertError) {
					insertErrorMessage = null;
					break;
				}

				if (insertError.code === '23505') {
					insertErrorMessage =
						'Could not create a unique gallery slug for this title. Try a more specific title.';
					continue;
				}

				insertErrorMessage = insertError.message || 'Failed to create gallery.';
				break;
			}

			if (insertErrorMessage) {
				throw new Error(insertErrorMessage);
			}

			setTitle('');
			setDescription('');
			setSuccessMessage('Gallery created.');
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to create gallery.';
			setErrorMessage(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section className={styles.galleryPanel} aria-labelledby="create-gallery-heading">
			<h3 id="create-gallery-heading" className={styles.galleryHeading}>
				Create gallery
			</h3>
			<form className={styles.galleryForm} onSubmit={handle_submit}>
				<div className={styles.formField}>
					<label className={styles.formLabel} htmlFor="gallery-title">
						Title
					</label>
					<input
						id="gallery-title"
						name="title"
						type="text"
						autoComplete="off"
						required
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						className={styles.formInput}
						placeholder="e.g. Engagement party"
					/>
				</div>

				<div className={styles.formField}>
					<label className={styles.formLabel} htmlFor="gallery-description">
						Description <span className={styles.optionalField}>(optional)</span>
					</label>
					<textarea
						id="gallery-description"
						name="description"
						rows={3}
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						className={styles.formTextarea}
						placeholder="Short notes about this gallery"
					/>
				</div>

				<div className={styles.galleryActions}>
					<Button type="submit" variant="primary" disabled={isSubmitDisabled}>
						{isSubmitting ? 'Creating…' : 'Create gallery'}
					</Button>
				</div>

				{errorMessage ? (
					<p className={styles.formError} role="alert">
						{errorMessage}
					</p>
				) : null}
				{successMessage ? <p className={styles.formSuccess}>{successMessage}</p> : null}
			</form>
		</section>
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
	const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
	const value = bytes / base ** unitIndex;
	return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function get_default_title_from_filename(filename: string): string {
	const parts = filename.split('.');
	if (parts.length <= 1) return filename;
	parts.pop();
	return parts.join('.');
}
