'use client';

import { useActionState } from 'react';
import {
	loginuserwithemailpassword,
	type AuthFormState,
} from './auth.actions';

const initialstate: AuthFormState = null;

export function UserLoginForm() {
	const [state, formaction, pending] = useActionState(
		loginuserwithemailpassword,
		initialstate
	);

	return (
		<form
			action={formaction}
			noValidate
			aria-label="Login form"
			style={{ display: 'flex', flexDirection: 'column' }}
		>
			{state?.success === false && state.error && (
				<p
					role="alert"
					aria-live="polite"
					style={{
						marginBottom: '0.75rem',
						padding: '0.5rem',
						backgroundColor: 'rgba(220, 38, 38, 0.1)',
						border: '1px solid rgb(220, 38, 38)',
						borderRadius: '4px',
						color: 'rgb(185, 28, 28)',
						fontSize: '0.875rem',
					}}
				>
					{state.error}
				</p>
			)}
			{state?.success === true && (
				<p role="status" aria-live="polite" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
					You are logged in.
				</p>
			)}

			<label htmlFor="login-email" style={{ display: 'block', marginBottom: '0.25rem' }}>
				Email
			</label>
			<input
				id="login-email"
				type="email"
				placeholder="Email..."
				name="email"
				required
				autoComplete="email"
				aria-required="true"
				disabled={pending}
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
				name="password"
				placeholder="Password..."
				required
				autoComplete="current-password"
				aria-required="true"
				disabled={pending}
				style={{
					display: 'block',
					width: '100%',
					marginBottom: '0.75rem',
					boxSizing: 'border-box',
				}}
			/>
			<div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
				<button type="submit" disabled={pending} aria-busy={pending}>
					{pending ? 'Signing in…' : 'Login'}
				</button>
				<button type="button" disabled={pending} aria-label="Reset form">
					Reset
				</button>
			</div>
		</form>
	);
}
