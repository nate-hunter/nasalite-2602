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
	isuseradmin: boolean;
};

export function Navbarshell({
	pathname,
	isnavopen,
	onmenutoggle,
	user,
	isuseradmin,
}: Navbarshellprops) {
	// console.log({ user });
	return (
		<header className={styles.root}>
			<div className={styles.inner}>
				<div className={styles.navBrand}>
					<Link href="/">L &amp; N</Link>
					{/* <Link href="/">Lisa &amp; Nate</Link> */}
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
						<>
							<Link href="/media/upload" className={styles.uploadMediaBtn}>
								+ Upload Media
							</Link>
							{isuseradmin && (
								<Link href="/admin" className={styles.signin}>
									Admin
								</Link>
							)}
							<span className={styles.userEmail} title={user.email}>
								{user.email}
							</span>
							<form action="/api/auth/logout" method="post">
								<button type="submit" className={styles.logoutBtn}>
									Logout
								</button>
							</form>
						</>
					) : (
						<Link href="/login" className={styles.signin}>
							Sign in
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
