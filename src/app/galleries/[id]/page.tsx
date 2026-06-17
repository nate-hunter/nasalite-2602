import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const supabase = await createClient();
	const { data: gallery, error } = await supabase
		.from('galleries')
		.select('id, title, description, is_public')
		.eq('id', id)
		.single();

	if (error || !gallery) notFound();

	return (
		<div
			style={{
				padding: 'var(--sp-8) var(--layout-gutter)',
				maxWidth: 'var(--layout-max-width)',
				margin: '0 auto',
			}}
		>
			<Link
				href="/"
				style={{
					marginBottom: 'var(--sp-4)',
					display: 'inline-block',
					color: 'var(--color-primary)',
				}}
			>
				← Home
			</Link>
			<h1
				style={{
					fontFamily: 'var(--font-playfair)',
					fontSize: 'var(--font-hero)',
					marginBottom: 'var(--sp-2)',
				}}
			>
				{gallery.title}
			</h1>
			{gallery.description && (
				<p style={{ color: 'var(--color-font-muted)', marginBottom: 'var(--sp-4)' }}>
					{gallery.description}
				</p>
			)}
			<p style={{ fontSize: 'var(--font-caption)', color: 'var(--color-font-muted)' }}>
				{gallery.is_public ? 'Public' : 'Private'} gallery · Add media to this gallery from the
				admin area.
			</p>
		</div>
	);
}
