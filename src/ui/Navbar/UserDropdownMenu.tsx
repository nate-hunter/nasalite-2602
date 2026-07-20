'use client';

import { useState } from 'react';
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

export default function UserDropdownMenu() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const userInitials = 'UA';
	return (
		<div className={styles.dropdownMenuWrapper}>
			<button onClick={() => setIsMenuOpen((prev) => !prev)} className={styles.userAvatarBtn}>
				{userInitials}
			</button>

			{isMenuOpen ? (
				<>
					<UserDropdownOptions />
				</>
			) : null}
		</div>
	);
}

function UserDropdownOptions() {
	return (
		<div className={styles.dropdownMenu}>
			<Link href="/user-profile" className={styles.dropdownOption}>
				User Profile
			</Link>
			<Link href="/admin" className={styles.dropdownOption}>
				Admin
			</Link>

			<Link href="/media/upload" className={styles.dropdownOption}>
				Upload
			</Link>

			<form action="/api/auth/logout" method="post" className={styles.dropdownOption}>
				<button type="submit">Logout</button>
			</form>
		</div>
	);
}
