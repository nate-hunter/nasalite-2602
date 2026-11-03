import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const REDIRECT_PAGE_PATH = '/';

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const token_hash = searchParams.get('token_hash');
	const type = searchParams.get('type') as EmailOtpType | null;

	if (token_hash && type) {
		const supabase = await createClient();
		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});
		if (!error) {
			return NextResponse.redirect(new URL(REDIRECT_PAGE_PATH, request.url));
		}
		console.error('Magic link verification failed:', error.message);
	}

	// Fresh URLs (not a clone of request.url) so the secret token_hash is never carried into the redirect.
	const error_url = new URL('/login', request.url);
	error_url.searchParams.set('error', 'invalid-link');
	return NextResponse.redirect(error_url);
}
