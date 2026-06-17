/*
 * File limits, allowed types go here...
 */

type AllowedStorageBucketId = 'media-items' | 'app-media-items';

/**
 * Seconds value for Supabase Storage `cacheControl` upload option.
 * The SDK sends `Cache-Control: max-age=<seconds>`; do not pass a full directive string.
 */
export function storage_cache_control_seconds(bucket_id: AllowedStorageBucketId): string {
	return bucket_id === 'app-media-items' ? '31536000' : '3600';
}
