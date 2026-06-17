import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { AdminTabBar } from './_components/AdminTabBar';
import styles from './admin-layout.module.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect('/login');
	}

	const { data: profile } = await supabase
		.from('user_profiles')
		.select('app_role')
		.eq('id', user.id)
		.single();

	if (profile?.app_role !== 'super_admin') {
		redirect('/');
	}

	return (
		<div className={styles.layoutShell}>
			<div className={styles.layoutMain}>
				<header className={styles.layoutHeader}>
					<h1 className={styles.layoutTitle}>Admin</h1>
					<p className={styles.layoutSubtitle}>
						Create public galleries and upload app media. Only super users can manage this
						content.
					</p>
				</header>
				<AdminTabBar />
				<div role="tabpanel" className={styles.tabPanel}>
					{children}
				</div>
			</div>
		</div>
	);
}
