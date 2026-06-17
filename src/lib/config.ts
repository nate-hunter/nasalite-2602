/*
 * Env vars, app-wide settings go here...
 */

// Supabase:
export const supabaseurl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabsepublickey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Public URL prefix for the `app-media-items` bucket (`file_path` is relative to this prefix). */
export const APP_MEDIA_PUBLIC_URL = `${supabaseurl}/storage/v1/object/public/app-media-items`;

/**
 * Public object URL for any Supabase Storage bucket. `file_path` is relative to the bucket root.
 * Safe for client components (uses only `NEXT_PUBLIC_SUPABASE_URL`).
 */
export function storage_public_object_url(bucket_id: string, file_path: string): string {
	return `${supabaseurl}/storage/v1/object/public/${bucket_id}/${file_path}`;
}

/**
 * Server-only secret key for privileged Supabase operations.
 * Never expose this value in client-side code or `NEXT_PUBLIC_*` variables.
 */
export function getSupabaseServiceRoleKey(): string {
	const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!value) {
		throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
	}
	return value;
}

// ImageKit (public — safe for client):
export const imagekitpubkey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
export const imagekiturl = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;

/**
 * Server-only ImageKit private key for signing and auth.
 * Never expose this value in client-side code or `NEXT_PUBLIC_*` variables.
 */
export function getImageKitPrivateKey(): string {
	const value = process.env.IMAGEKIT_PRIVATE_KEY;
	if (!value) {
		throw new Error('Missing required environment variable: IMAGEKIT_PRIVATE_KEY');
	}
	return value;
}

// BigDataCloud (reverse geocode client; no key in URL). Dev: set NEXT_PUBLIC_ENABLE_REVERSE_GEOCODING=true to test.
export const reversegeocodeurl = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
export const isReverseGeocodingLookupEnabled =
	process.env.NODE_ENV === 'production' ||
	process.env.NEXT_PUBLIC_ENABLE_REVERSE_GEOCODING === 'true';
