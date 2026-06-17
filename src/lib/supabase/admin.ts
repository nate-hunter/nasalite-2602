import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { getSupabaseServiceRoleKey, supabaseurl } from '@/lib/config';

export function createAdminClient() {
	const supabaseUrl = supabaseurl;
	const serviceRoleKey = getSupabaseServiceRoleKey();

	return createClient<Database>(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
