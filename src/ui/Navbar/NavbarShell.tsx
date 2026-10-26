import Link from 'next/link';

import { get_user_initials } from './get_user_initials';
import styles from './Navbar.module.css';
import UserDropdownMenu from './UserDropdownMenu';

type NavItem = {
	href: string;
	label: string;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
	{ href: '/', label: 'Home' },
	// { href: '/galleries', label: 'Galleries' },
] as const;

function isactive(pathname: string, href: string): boolean {
	if (href === '/') {
		return pathname === '/' || pathname === '/home';
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}

export type NavbarUserProfile = {
	full_name: string | null;
	email: string | null;
	avatar_url: string | null;
	app_role: string;
};

type Navbarshellprops = {
	pathname: string;
	isnavopen: boolean;
	onmenutoggle: () => void;
	user: { email?: string } | null;
	user_profile: NavbarUserProfile | null;
	isuseradmin: boolean;
};

export function Navbarshell({
	pathname,
	isnavopen,
	onmenutoggle,
	user,
	user_profile,
	isuseradmin,
}: Navbarshellprops) {
	const user_initials = get_user_initials({
		full_name: user_profile?.full_name,
		email: user_profile?.email ?? user?.email,
	});

	return (
		<header className={styles.root}>
			<div className={styles.inner}>
				<div className={styles.navBrand}>
					<Link href="/">
						<span className={styles.brandShort}>L&amp;N</span>
						<span className={styles.brandFull}>Lisa &amp; Nate</span>
					</Link>
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
						<UserDropdownMenu
							avatar_url={user_profile?.avatar_url ?? null}
							user_initials={user_initials}
							is_user_admin={isuseradmin}
						/>
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

