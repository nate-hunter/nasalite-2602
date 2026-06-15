/**
 * Reverse geocoding via BigDataCloud’s `reverse-geocode-client` REST endpoint (no API key in URL).
 * Package overview: https://www.bigdatacloud.com/packages/reverse-geocoding
 *
 * Base URL and enable flag live in `@/lib/config` (same pattern as Supabase / ImageKit).
 */

import {
	isReverseGeocodingLookupEnabled,
	reversegeocodeurl,
} from '@/lib/config';

export { isReverseGeocodingLookupEnabled };

const REQUEST_TIMEOUT_MS = 5000;

type GeocodingResponse = {
	locality?: string;
	city?: string;
	principalSubdivision?: string;
	countryName?: string;
};

function isValidCoordinate(lat: number, lon: number): boolean {
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lon) &&
		lat >= -90 &&
		lat <= 90 &&
		lon >= -180 &&
		lon <= 180
	);
}

/**
 * Converts GPS coordinates to a short human-readable label (e.g. city, region, country).
 * Returns null on invalid input, HTTP errors, timeouts, or empty responses.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
	if (!isReverseGeocodingLookupEnabled) {
		return null;
	}

	if (!isValidCoordinate(lat, lon)) {
		return null;
	}

	try {
		const url = new URL(reversegeocodeurl);
		url.searchParams.set('latitude', String(lat));
		url.searchParams.set('longitude', String(lon));
		url.searchParams.set('localityLanguage', 'en');

		const response = await fetch(url.toString(), {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as GeocodingResponse;

		const parts: string[] = [];
		if (data.locality) parts.push(data.locality);
		if (data.city && data.city !== data.locality) parts.push(data.city);
		if (data.principalSubdivision) parts.push(data.principalSubdivision);
		if (data.countryName) parts.push(data.countryName);

		if (parts.length === 0) {
			return null;
		}

		return parts.join(', ');
	} catch {
		return null;
	}
}

/**
 * Reverse geocode many coordinates. Each lookup is independent; failures become null.
 */
export async function reverseGeocodeMany(
	coordinates: Array<[number, number]>
): Promise<Array<string | null>> {
	if (!isReverseGeocodingLookupEnabled) {
		return coordinates.map(() => null);
	}
	return Promise.all(coordinates.map(([lat, lon]) => reverseGeocode(lat, lon)));
}
