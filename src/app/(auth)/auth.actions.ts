'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signInWithMagicLink(formData: FormData) {
	const email = formData.get('email') as string;
	const supabase = await createClient();

	// TODO: Add email validation?
	if (!email) {
		return redirect('/login?error=invalid-email');
	}

	const headersList = await headers();
	const origin = headersList.get('origin');
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: {
			emailRedirectTo: `${origin}/api/auth/confirm`,
		},
	});

	if (error) {
		console.error('Error sending magic link:', error);
		return redirect('/login?error=unknown');
	}

	return redirect('/login?success=true');
}
