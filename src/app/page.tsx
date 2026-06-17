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
					<h1 className={styles.wordmark}>The Hunter's</h1>
					<p className={styles.tagline}>Our memories:</p>
					<Link href="/galleries/wedding-memories" className={styles.cta}>
						Wedding Memories
					</Link>
				</div>
			</main>
		</div>
	);
}
