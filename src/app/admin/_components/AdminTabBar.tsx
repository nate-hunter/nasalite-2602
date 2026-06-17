'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from '../admin-layout.module.css';

type AdminTab = {
	label: string;
	href: string;
	/** Match the full pathname exactly; sub-routes use prefix matching. */
	exact: boolean;
};

const ADMIN_TABS = [
	{ label: 'Overview', href: '/admin', exact: true },
	{ label: 'Manage Galleries', href: '/admin/galleries', exact: false },
	{ label: 'Upload Media', href: '/admin/media', exact: false },
	{ label: 'Manage Pages', href: '/admin/manage-pages', exact: false },
] as const satisfies ReadonlyArray<AdminTab>;

export function AdminTabBar() {
	const pathname = usePathname();

	return (
		<div className={styles.tabsShell}>
			<div className={styles.tabsRow} role="tablist" aria-label="Admin sections">
				{ADMIN_TABS.map(({ label, href, exact }) => {
					const is_active = exact ? pathname === href : pathname.startsWith(href);
					return (
						<Link
							key={href}
							href={href}
							role="tab"
							aria-selected={is_active}
							className={is_active ? styles.tabActive : styles.tab}
						>
							{label}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
