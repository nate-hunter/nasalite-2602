'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { Navbarshell } from '@/ui/Navbar/NavbarShell';

export default function Navbar() {
	// console.log('### Navbar ###');
	const pathname = usePathname() ?? '/';
	const [isnavopen, setisnavopen] = useState(false);
	// const [user, setuser] = useState<{ email?: string } | null>(null);

	const supabase = createClient();
	const [user, setuser] = useState<User | null>(null);
	const [isuseradmin, setisuseradmin] = useState(false);
	useEffect(() => {
		async function getCurrentUser() {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				const { data: profile } = await supabase
					.from('user_profiles')
					.select('*')
					.eq('id', user.id)
					.single();
				// console.log('--- user profile =>', profile);
				setisuseradmin(profile?.app_role === 'super_admin');
			} else {
				setisuseradmin(false);
			}
			setuser(user);
		}
		getCurrentUser();
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setuser(session?.user ?? null);
		});
		return () => subscription.unsubscribe();
	}, [supabase.auth]);

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
			isuseradmin={isuseradmin}
		/>
	);
}
