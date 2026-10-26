'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import styles from './Navbar.module.css';

/** USER DROPDOWN ITEMS/OPTIONS
 *
 * 1. [ ] [OPTIONAL] View `email`
 * 2. [ ] [OPTIONAL] View `username`
 * 3. [X] Navigate to `user-profile` page
 * 4. [X] Navigate to `upload-media` page/modal
 * 5. [X] Navigate to `admin` page
 * 6. [X] Logout
 *
 */

type UserDropdownMenuProps = {
	avatar_url: string | null;
	user_initials: string;
	is_user_admin: boolean;
};

export default function UserDropdownMenu({ avatar_url, user_initials, is_user_admin }: UserDropdownMenuProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [failed_avatar_url, set_failed_avatar_url] = useState<string | null>(null);
	const should_show_avatar = Boolean(avatar_url) && avatar_url !== failed_avatar_url;
	const wrapperRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!isMenuOpen) return;

		function handlePointerDown(event: PointerEvent) {
			if (!wrapperRef.current?.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setIsMenuOpen(false);
				buttonRef.current?.focus();
			}
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isMenuOpen]);

	return (
		<div ref={wrapperRef} className={styles.dropdownMenuWrapper}>
			<button
				ref={buttonRef}
				type="button"
				aria-label="User menu"
				aria-haspopup="true"
				aria-expanded={isMenuOpen}
				onClick={() => setIsMenuOpen((prev) => !prev)}
				className={styles.userAvatarBtn}
			>
				{should_show_avatar && avatar_url ? (
					// eslint-disable-next-line @next/next/no-img-element -- avatar host isn't known ahead of time (e.g. OAuth provider), so next/image remotePatterns can't cover it
					<img
						src={avatar_url}
						alt=""
						className={styles.userAvatarImg}
						referrerPolicy="no-referrer"
						onError={() => set_failed_avatar_url(avatar_url)}
					/>
				) : (
					<span aria-hidden="true">{user_initials}</span>
				)}
			</button>

			{isMenuOpen ? (
				<UserDropdownOptions is_user_admin={is_user_admin} onSelect={() => setIsMenuOpen(false)} />
			) : null}
		</div>
	);
}

type UserDropdownOptionsProps = {
	is_user_admin: boolean;
	onSelect: () => void;
};

function UserDropdownOptions({ is_user_admin, onSelect }: UserDropdownOptionsProps) {
	return (
		<div className={styles.dropdownMenu}>
			<Link href="/user-profile" className={styles.dropdownOption} onClick={onSelect}>
				User Profile
			</Link>
			<Link href="/media/upload" className={styles.dropdownOption} onClick={onSelect}>
				Upload
			</Link>
			{is_user_admin ? (
				<Link href="/admin" className={styles.dropdownOption} onClick={onSelect}>
					Admin
				</Link>
			) : null}

			{/* Closing here would unmount the form before it submits; the logout redirect replaces the page anyway. */}
			<form action="/api/auth/logout" method="post" className={styles.dropdownOption}>
				<button type="submit">Logout</button>
			</form>
		</div>
	);
}
