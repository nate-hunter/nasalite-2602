'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { Navbarshell } from '@/ui/Navbar/NavbarShell';
import type { NavbarUserProfile } from '@/ui/Navbar/NavbarShell';

export default function Navbar() {
	// console.log('### Navbar ###');
	const pathname = usePathname() ?? '/';
	const [isnavopen, setisnavopen] = useState(false);
	const [supabase] = useState(createClient);
	const [user, setuser] = useState<User | null>(null);
	const [loaded_profile, set_loaded_profile] = useState<{
		user_id: string;
		profile: NavbarUserProfile | null;
	} | null>(null);
	const user_id = user?.id ?? null;
	const user_profile = loaded_profile?.user_id === user_id ? loaded_profile.profile : null;

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => setuser(data.user));

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setuser(session?.user ?? null);
		});
		return () => subscription.unsubscribe();
	}, [supabase.auth]);

	// Separate from onAuthStateChange: awaiting Supabase calls inside that callback can deadlock.
	useEffect(() => {
		if (!user_id) return;

		let is_cancelled = false;

		supabase
			.from('user_profiles')
			.select('full_name, email, avatar_url, app_role')
			.eq('id', user_id)
			.single()
			.then(({ data }) => {
				if (!is_cancelled) set_loaded_profile({ user_id, profile: data });
			});

		return () => {
			is_cancelled = true;
		};
	}, [supabase, user_id]);

	const isuseradmin = user_profile?.app_role === 'super_admin';

	// console.log('#--- $isuseradmin$ =>', isuseradmin);
	// console.log('#--- $user$ =>', user);

	// useEffect(() => {
	// 	const supabase = createClient();

	// 	const setuserfromsession = () => {
	// 		supabase.auth.getUser().then(({ data: { user: u } }) => setuser(u ?? null));
	// 	};

	// 	setuserfromsession();
	// 	const {
	// 		data: { subscription },
	// 	} = supabase.auth.onAuthStateChange(() => setuserfromsession());
	// 	return () => subscription.unsubscribe();
	// }, []);

	return (
		<Navbarshell
			pathname={pathname}
			isnavopen={isnavopen}
			onmenutoggle={() => setisnavopen((value) => !value)}
			user={user}
			user_profile={user_profile}
			isuseradmin={isuseradmin}
		/>
	);
}
