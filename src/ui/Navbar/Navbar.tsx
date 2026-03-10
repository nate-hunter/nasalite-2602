'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { Navbarshell } from '@/ui/Navbar/NavbarShell';

export default function Navbar() {
	const pathname = usePathname() ?? '/';
	const [isnavopen, setisnavopen] = useState(false);
	const [user, setuser] = useState<{ email?: string } | null>(null);

	useEffect(() => {
		const supabase = createClient();

		const setuserfromsession = () => {
			supabase.auth.getUser().then(({ data: { user: u } }) => setuser(u ?? null));
		};

		setuserfromsession();
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(() => setuserfromsession());
		return () => subscription.unsubscribe();
	}, []);

	return (
		<Navbarshell
			pathname={pathname}
			isnavopen={isnavopen}
			onmenutoggle={() => setisnavopen((value) => !value)}
			user={user}
		/>
	);
}
