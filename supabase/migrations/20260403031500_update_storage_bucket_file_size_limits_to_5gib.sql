-- migration: update_storage_bucket_file_size_limits_to_5gib
-- purpose: raise existing storage bucket file size limits to 5 gib for large video uploads.
-- affected: storage.buckets.file_size_limit for ids `media-items` and `app-media-items`.
-- note: this migration updates existing rows and is safe to run multiple times.

-- 5 gib in bytes
-- 5 * 1024 * 1024 * 1024 = 5368709120
update storage.buckets
set file_size_limit = 5368709120
where id in ('media-items', 'app-media-items');
