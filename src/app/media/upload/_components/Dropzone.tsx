'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { ImagePlusIcon } from '@/ui/Icon';
import styles from './Dropzone.module.css';

export type DropzoneProps = {
	/** Called when files are chosen via drop or the file picker. */
	onFilesSelected?: (files: File[]) => void;
};

export default function Dropzone({ onFilesSelected }: DropzoneProps) {
	const inputId = useId();
	const [isDragging, setIsDragging] = useState(false);
	const dragCounter = useRef(0);

	const emitFiles = useCallback(
		(fileList: FileList | null) => {
			if (!fileList?.length) return;
			onFilesSelected?.(Array.from(fileList));
		},
		[onFilesSelected]
	);

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current += 1;
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current -= 1;
		if (dragCounter.current <= 0) {
			dragCounter.current = 0;
			setIsDragging(false);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = 'copy';
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current = 0;
		setIsDragging(false);
		emitFiles(e.dataTransfer.files);
	};

	return (
		<label
			htmlFor={inputId}
			className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			<input
				id={inputId}
				type="file"
				multiple
				accept="image/*,video/*"
				className={styles.input}
				onChange={(e) => {
					emitFiles(e.target.files);
					e.target.value = '';
				}}
			/>
			<span className={styles.iconWrap} aria-hidden>
				<ImagePlusIcon size={28} />
			</span>
			<div className={styles.textBlock}>
				<p className={styles.primary}>Drop files here, or click to select</p>
				<p className={styles.secondary}>Max file size: 10MB (photos) / 5GB (videos)</p>
			</div>
		</label>
	);
}
