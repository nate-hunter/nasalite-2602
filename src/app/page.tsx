import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<div className={styles.hero}>
					<h1 className={styles.wordmark}>The Hunter's</h1>
					<p className={styles.tagline}>Our wedding memories</p>
					<Link href="/wedding" className={styles.cta}>
						View galleries
					</Link>
				</div>
			</main>
		</div>
	);
}
