'use client';

import { SubmitEvent, useState } from 'react';

type AuthUser = {
	email: string;
	password: string;
};

function registerwithemailpassword(authuser: AuthUser) {
	// TODO: call API (e.g. Supabase auth signUp). authuser.email, authuser.password available.
	console.log({ authuser });
}

export default function RegisterPage() {
	const [useremail, setuseremail] = useState('');
	const [userpassword, setuserpassword] = useState('');
	const [userpasswordconfirm, setuserpasswordconfirm] = useState('');

	function handlesubmit(e: SubmitEvent) {
		e.preventDefault();
		if (userpassword !== userpasswordconfirm) return;
		const authuser: AuthUser = { email: useremail, password: userpassword };
		registerwithemailpassword(authuser);
	}

	function handlereset() {
		setuseremail('');
		setuserpassword('');
		setuserpasswordconfirm('');
	}

	return (
		<div style={{ maxWidth: '20rem', margin: '0 auto', padding: '1rem' }}>
			<h1 style={{ marginBottom: '1rem' }}>Register</h1>

			<form onSubmit={handlesubmit} noValidate aria-label="Registration form">
				<label htmlFor="register-email" style={{ display: 'block', marginBottom: '0.25rem' }}>
					Email
				</label>
				<input
					id="register-email"
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

				<label htmlFor="register-password" style={{ display: 'block', marginBottom: '0.25rem' }}>
					Password
				</label>
				<input
					id="register-password"
					type="password"
					name="userpassword"
					value={userpassword}
					onChange={(e) => setuserpassword(e.target.value)}
					required
					autoComplete="new-password"
					aria-required="true"
					style={{
						display: 'block',
						width: '100%',
						marginBottom: '0.75rem',
						boxSizing: 'border-box',
					}}
				/>

				<label htmlFor="register-password-confirm" style={{ display: 'block', marginBottom: '0.25rem' }}>
					Confirm password
				</label>
				<input
					id="register-password-confirm"
					type="password"
					name="userpasswordconfirm"
					value={userpasswordconfirm}
					onChange={(e) => setuserpasswordconfirm(e.target.value)}
					required
					autoComplete="new-password"
					aria-required="true"
					style={{
						display: 'block',
						width: '100%',
						marginBottom: '0.75rem',
						boxSizing: 'border-box',
					}}
				/>
				<div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
					<button type="submit">Register</button>
					<button type="button" onClick={handlereset} aria-label="Reset form">
						Reset
					</button>
				</div>
			</form>
		</div>
	);
}
