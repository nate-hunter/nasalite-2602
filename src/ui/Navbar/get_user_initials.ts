type GetUserInitialsArgs = {
	full_name: string | null | undefined;
	email: string | null | undefined;
};

const FALLBACK_INITIALS = '--';

export function get_user_initials({ full_name, email }: GetUserInitialsArgs): string {
	const name_parts = (full_name ?? '').trim().split(/\s+/).filter(Boolean);

	if (name_parts.length >= 2) {
		const first_initial = name_parts[0].charAt(0);
		const last_initial = name_parts[name_parts.length - 1].charAt(0);
		return `${first_initial}${last_initial}`.toUpperCase();
	}

	if (name_parts.length === 1) {
		return name_parts[0].slice(0, 2).toUpperCase();
	}

	const email_name = (email ?? '').trim().split('@')[0];
	if (email_name) {
		return email_name.slice(0, 2).toUpperCase();
	}

	return FALLBACK_INITIALS;
}
