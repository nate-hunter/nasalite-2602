import Link from 'next/link';

import styles from './Navbar.module.css';

type NavItem = {
	href: string;
	label: string;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
	{ href: '/', label: 'Home' },
	{ href: '/galleries', label: 'Galleries' },
] as const;

function isactive(pathname: string, href: string): boolean {
	if (href === '/') {
		return pathname === '/' || pathname === '/home';
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}

type Navbarshellprops = {
	pathname: string;
	isnavopen: boolean;
	onmenutoggle: () => void;
	user: { email?: string } | null;
};

export function Navbarshell({ pathname, isnavopen, onmenutoggle, user }: Navbarshellprops) {
	return (
		<header className={styles.root}>
			<div className={styles.inner}>
				<div className={styles.navBrand}>
					<Link href="/">Lisa &amp; Nate</Link>
				</div>

				<button
					type="button"
					className={styles.menuButton}
					aria-label="Toggle navigation"
					aria-expanded={isnavopen}
					onClick={onmenutoggle}
				>
					<span className={styles.menuIcon} aria-hidden="true" />
				</button>

				<nav
					className={[styles.nav, isnavopen ? styles.navOpen : styles.navCollapsed]
						.filter(Boolean)
						.join(' ')}
					aria-label="Main"
				>
					<ul className={styles.navLinks}>
						{NAV_ITEMS.map((item) => {
							const active = isactive(pathname, item.href);

							return (
								<li key={item.href}>
									<Link
										href={item.href}
										aria-current={active ? 'page' : undefined}
										className={[styles.navLink, active ? styles.navLinkActive : undefined]
											.filter(Boolean)
											.join(' ')}
									>
										{item.label}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>

				<div className={styles.auth}>
					{user?.email ? (
						<span className={styles.userEmail} title={user.email}>
							{user.email}
						</span>
					) : (
						<Link href="/auth" className={styles.signin}>
							Sign in
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
