export function normalizeSlug(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function slugify(value: string): string {
	const normalized = normalizeSlug(value);

	return normalized.length > 0 ? normalized : 'gallery';
}

export function createUniqueSlug(base: string, existingSlugs: Iterable<string>): string {
	const existing = new Set(Array.from(existingSlugs).map((slug) => slug.toLowerCase()));
	const normalizedBase = slugify(base);

	if (!existing.has(normalizedBase)) {
		return normalizedBase;
	}

	let counter = 2;
	while (existing.has(`${normalizedBase}-${counter}`)) {
		counter += 1;
	}

	return `${normalizedBase}-${counter}`;
}

export function createSlugCandidate(base: string, attempt: number): string {
	const normalizedBase = slugify(base);
	if (attempt <= 0) {
		return normalizedBase;
	}

	return `${normalizedBase}-${attempt + 1}`;
}
