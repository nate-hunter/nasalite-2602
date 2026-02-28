'use client';

import { useActionState } from 'react';
import {
	registeruserwithemailpassword,
	type AuthFormState,
} from './auth.actions';

const initialstate: AuthFormState = null;

export function UserRegisterForm() {
	const [state, formaction, pending] = useActionState(
		registeruserwithemailpassword,
		initialstate
	);

	return (
		<form
			action={formaction}
			noValidate
			aria-label="Registration form"
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
			{state?.success === true && state.message && (
				<p
					role="status"
					aria-live="polite"
					style={{
						marginBottom: '0.75rem',
						padding: '0.5rem',
						backgroundColor: 'rgba(22, 163, 74, 0.1)',
						border: '1px solid rgb(22, 163, 74)',
						borderRadius: '4px',
						color: 'rgb(21, 128, 61)',
						fontSize: '0.875rem',
					}}
				>
					{state.message}
				</p>
			)}

			<label htmlFor="register-email" style={{ display: 'block', marginBottom: '0.25rem' }}>
				Email*
			</label>
			<input
				id="register-email"
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

			<label htmlFor="register-fullname" style={{ display: 'block', marginBottom: '0.25rem' }}>
				Full Name
			</label>
			<input
				id="register-fullname"
				type="text"
				placeholder="Full name..."
				name="fullname"
				autoComplete="name"
				disabled={pending}
				style={{
					display: 'block',
					width: '100%',
					marginBottom: '0.75rem',
					boxSizing: 'border-box',
				}}
			/>

			<label htmlFor="register-password" style={{ display: 'block', marginBottom: '0.25rem' }}>
				Password*
			</label>
			<input
				id="register-password"
				type="password"
				name="password"
				placeholder="Password..."
				required
				autoComplete="new-password"
				aria-required="true"
				disabled={pending}
				style={{
					display: 'block',
					width: '100%',
					marginBottom: '0.75rem',
					boxSizing: 'border-box',
				}}
			/>

			<label
				htmlFor="register-password-confirm"
				style={{ display: 'block', marginBottom: '0.25rem' }}
			>
				Confirm Password*
			</label>
			<input
				id="register-password-confirm"
				type="password"
				name="confirmpassword"
				placeholder="Confirm password..."
				required
				autoComplete="new-password"
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
					{pending ? 'Signing up…' : 'Register'}
				</button>
				<button type="button" disabled={pending} aria-label="Reset form">
					Reset
				</button>
			</div>
		</form>
	);
}
