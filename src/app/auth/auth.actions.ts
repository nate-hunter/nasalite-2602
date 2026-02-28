'use server';

import { createClient } from '@/lib/supabase/server';
import { SignUpWithPasswordCredentials } from '@supabase/supabase-js';

// Shared state shape for useActionState (register and login forms).
export type AuthFormState =
	| { success: true; message?: string }
	| { success: false; error: string }
	| null;

export async function registeruserwithemailpassword(
	prevstate: AuthFormState,
	formdata: FormData
): Promise<AuthFormState> {
	const formemail = formdata.get('email');
	const formfullname = formdata.get('fullname');
	const formpassword = formdata.get('password');
	const formconfirmpassword = formdata.get('confirmpassword');

	const trimemail = typeof formemail === 'string' ? formemail.trim() : '';
	const trimfullname = typeof formfullname === 'string' ? formfullname.trim() : '';
	const trimpassword = typeof formpassword === 'string' ? formpassword : '';
	const trimconfirm = typeof formconfirmpassword === 'string' ? formconfirmpassword : '';

	if (!trimemail || !trimpassword) {
		return { success: false, error: 'Email and password are required.' };
	}
	if (trimpassword !== trimconfirm) {
		return { success: false, error: 'Passwords do not match.' };
	}

	const userdata: SignUpWithPasswordCredentials = {
		email: trimemail,
		password: trimpassword,
		options: {
			data: {
				full_name: trimfullname || undefined,
			},
			...(process.env.NEXT_PUBLIC_SITE_URL && {
				emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
			}),
		},
	};

	try {
		const sb = await createClient();
		const { data, error } = await sb.auth.signUp(userdata);
		if (error) {
			const errormessage =
				error.code === 'weak_password'
					? error.message
					: error.code === 'user_already_registered'
						? 'An account with this email already exists.'
						: error.message || 'Sign up failed. Please try again.';
			return { success: false, error: errormessage };
		}
		if (data.user && !data.session) {
			return { success: true, message: 'Check your email to confirm your account.' };
		}
		return { success: true };
	} catch {
		return { success: false, error: 'Something went wrong. Please try again.' };
	}
}

export async function loginuserwithemailpassword(
	prevstate: AuthFormState,
	formdata: FormData
): Promise<AuthFormState> {
	const formemail = formdata.get('email');
	const formpassword = formdata.get('password');

	const trimemail = typeof formemail === 'string' ? formemail.trim() : '';
	const trimpassword = typeof formpassword === 'string' ? formpassword : '';

	if (!trimemail || !trimpassword) {
		return { success: false, error: 'Email and password are required.' };
	}

	try {
		const sb = await createClient();
		const { data, error } = await sb.auth.signInWithPassword({
			email: trimemail,
			password: trimpassword,
		});
		if (error) {
			const errormessage =
				error.code === 'invalid_credentials'
					? 'Invalid email or password.'
					: error.message || 'Login failed. Please try again.';
			return { success: false, error: errormessage };
		}
		if (data.session) {
			return { success: true };
		}
		return { success: false, error: 'Login failed. Please try again.' };
	} catch {
		return { success: false, error: 'Something went wrong. Please try again.' };
	}
}
