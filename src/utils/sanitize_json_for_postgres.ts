import type { Json } from '@/lib/supabase/database.types';

/**
 * PostgreSQL jsonb rejects U+0000 (and some other C0 controls) in string values.
 * EXIF/IPTC parsers (e.g. exifr) can emit these in fields like ApplicationRecordVersion.
 */
function sanitizeStringForPostgresJson(value: string): string {
	return value
		.replace(/\u0000/g, '')
		.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

/**
 * Recursively sanitize a JSON-serializable value for safe storage in Postgres jsonb.
 */
export function sanitizeJsonForPostgres(value: unknown): Json {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string') return sanitizeStringForPostgresJson(value);
	if (typeof value === 'number' || typeof value === 'boolean') return value;
	if (value instanceof Date) return value.toISOString();
	if (Array.isArray(value)) return value.map((item) => sanitizeJsonForPostgres(item));
	if (typeof value === 'object') {
		const out: Record<string, Json> = {};
		for (const [key, nested] of Object.entries(value)) {
			out[key] = sanitizeJsonForPostgres(nested);
		}
		return out;
	}
	return null;
}
