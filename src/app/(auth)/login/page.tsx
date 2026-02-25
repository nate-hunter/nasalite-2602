'use client';

import { FormEvent, SubmitEvent, useState } from 'react';

type AuthUser = {
	email: string;
	password: string;
};

function loginwithemailpassword(authuser: AuthUser) {
	// TODO: call API (e.g. Supabase auth). authuser.email, authuser.password available.
	console.log({ authuser });
}

export default function LoginPage() {
	const [useremail, setuseremail] = useState('');
	const [userpassword, setuserpassword] = useState('');

	function handlesubmit(e: SubmitEvent) {
		e.preventDefault();
		const authuser: AuthUser = { email: useremail, password: userpassword };
		loginwithemailpassword(authuser);
	}

	function handlereset() {
		setuseremail('');
		setuserpassword('');
	}

	return (
		<div style={{ maxWidth: '20rem', margin: '0 auto', padding: '1rem' }}>
			<h1 style={{ marginBottom: '1rem' }}>Login</h1>

			<form onSubmit={handlesubmit} noValidate aria-label="Login form">
				<label htmlFor="login-email" style={{ display: 'block', marginBottom: '0.25rem' }}>
					Email
				</label>
				<input
					id="login-email"
					type="email"
					placeholder="Email..."
					name="useremail"
					value={useremail}
					onChange={(e) => setuseremail(e.target.value)}
					required
					autoComplete="email"
					aria-required="true"
					style={{
						display: 'block',
						width: '100%',
						marginBottom: '0.75rem',
						boxSizing: 'border-box',
					}}
				/>

				<label htmlFor="login-password" style={{ display: 'block', marginBottom: '0.25rem' }}>
					Password
				</label>
				<input
					id="login-password"
					type="password"
					name="userpassword"
					value={userpassword}
					onChange={(e) => setuserpassword(e.target.value)}
					required
					autoComplete="current-password"
					aria-required="true"
					style={{
						display: 'block',
						width: '100%',
						marginBottom: '0.75rem',
						boxSizing: 'border-box',
					}}
				/>
				<div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
					<button type="submit">Login</button>
					<button type="button" onClick={handlereset} aria-label="Reset form">
						Reset
					</button>
				</div>
			</form>
		</div>
	);
}
