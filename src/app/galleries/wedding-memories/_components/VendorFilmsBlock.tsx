'use client';

import dynamic from 'next/dynamic';
import { useId, useMemo, useState } from 'react';

import styles from '../wedding-memories.module.css';

import { VENDOR_VIDEOS, type VendorVideo } from './vendorVideos';

const ReactPlayer = dynamic(() => import('react-player'), {
	ssr: false,
	loading: () => <div className={styles.vendorPlayerLoading} aria-hidden />,
});

function findvideobyid(list: Array<VendorVideo>, id: number): VendorVideo | undefined {
	return list.find((v) => v.id === id);
}

export function VendorFilmsBlock() {
	const videos = useMemo(() => VENDOR_VIDEOS, []);
	const [selectedid, setselectedid] = useState<number>(() => videos[0]?.id ?? 0);
	const baseid = useId();

	if (videos.length === 0) return null;

	const activevideo = findvideobyid(videos, selectedid) ?? videos[0];

	function handletabselect(videoid: number) {
		setselectedid(videoid);
	}

	return (
		<section className={styles.vendorSection} aria-labelledby={`${baseid}-vendor-heading`}>
			<h2 id={`${baseid}-vendor-heading`} className={styles.vendorSectionTitle}>
				Videos
			</h2>

			<div className={styles.vendorTabs} role="tablist" aria-label="Wedding film selection">
				{videos.map((video) => {
					const tabid = `${baseid}-tab-${video.id}`;
					const panelid = `${baseid}-panel-${video.id}`;
					const isselected = video.id === activevideo.id;
					return (
						<button
							key={video.id}
							type="button"
							id={tabid}
							role="tab"
							aria-selected={isselected}
							aria-controls={panelid}
							tabIndex={isselected ? 0 : -1}
							className={isselected ? styles.vendorTabActive : styles.vendorTab}
							onClick={() => handletabselect(video.id)}
						>
							{video.title}
						</button>
					);
				})}
			</div>

			<div
				id={`${baseid}-panel-${activevideo.id}`}
				role="tabpanel"
				aria-labelledby={`${baseid}-tab-${activevideo.id}`}
				className={styles.vendorPanel}
			>
				<div className={styles.vendorPlayerShell}>
					<div className={styles.vendorPlayerInner}>
						<ReactPlayer
							key={activevideo.id}
							src={activevideo.url}
							controls
							width="100%"
							height="100%"
							style={{ width: '100%', height: '100%' }}
						/>
					</div>
				</div>

				{activevideo.cite && activevideo.cite_url ? (
					<p className={styles.vendorCite}>
						<a
							href={activevideo.cite_url}
							className={styles.vendorCiteLink}
							target="_blank"
							rel="noopener noreferrer"
						>
							{activevideo.cite}
						</a>
					</p>
				) : null}
			</div>
		</section>
	);
}
