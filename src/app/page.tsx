import Link from 'next/link';
import styles from './page.module.css';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	console.log('### HOME PAGE ###');
	console.log(`### user => ${user}`);

	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<div className={styles.hero}>
					<HeadlineText />
					<Link href="/galleries/wedding-memories" className={styles.cta}>
						Wedding Memories
					</Link>

					<LandingPageButtonsList _ins={_ITS} />
				</div>
			</main>
		</div>
	);
}

function HeadlineText() {
	return <h1 className={styles.wordmark}>The Hunter's</h1>;
}

function __HeadlineCaption() {
	return <p className={styles.tagline}>Our memories:</p>;
}

type TLandingPageButton = {
	title: string;
	url: string;
};

const _ITS: Array<TLandingPageButton> = [
	{
		title: 'Wedding Memories',
		url: '/galleries/wedding-memories',
	},
];

function LandingPageButtonsList({ _ins }: { _ins: Array<TLandingPageButton> }) {
	const _its = () => _ins.map((_it) => <LandingPageButtonItem {..._it} />);

	return (
		<>
			<ul>{_its()}</ul>
		</>
	);
}

function LandingPageButtonItem({ title, url }: TLandingPageButton) {
	const _it = { title, url };
	console.log({ _it });
	return (
		<li>
			<Link href={_it['url']} className={styles.cta}>
				{_it['title']}
			</Link>
		</li>
	);
}
