'use client';

import { useActionState } from 'react';
import { Button } from '@/ui/Button';
import { loginuserwithemailpassword, type AuthFormState } from '../auth.actions';
import styles from '../page.module.css';

const initialState: AuthFormState = null;

export type UserLoginFormProps = {
	className?: string;
};

export function UserLoginForm({ className }: UserLoginFormProps) {
	const [state, formAction, pending] = useActionState(loginuserwithemailpassword, initialState);

	return (
		<form
			action={formAction}
			noValidate
			aria-label="Login form"
			className={[styles.form, className].filter(Boolean).join(' ')}
		>
			{state?.success === false && state.error && (
				<p role="alert" aria-live="polite" className={`${styles.alert} ${styles.alertError}`}>
					{state.error}
				</p>
			)}
			{state?.success === true && (
				<p role="status" aria-live="polite" className={`${styles.alert} ${styles.alertSuccess}`}>
					You are logged in.
				</p>
			)}

			<div className={styles.fieldGroup}>
				<label htmlFor="login-email" className={styles.label}>
					Email
				</label>
				<input
					id="login-email"
					type="email"
					placeholder="your@email.com"
					name="email"
					required
					autoComplete="email"
					aria-required="true"
					disabled={pending}
					className={styles.input}
				/>
			</div>

			<div className={styles.fieldGroupLast}>
				<label htmlFor="login-password" className={styles.label}>
					Password
				</label>
				<input
					id="login-password"
					type="password"
					name="password"
					placeholder="Enter your password"
					required
					autoComplete="current-password"
					aria-required="true"
					disabled={pending}
					className={styles.input}
				/>
			</div>

			<div className={styles.submitWrap}>
				<Button
					type="submit"
					variant="primary"
					disabled={pending}
					aria-busy={pending}
					className={styles.submitFullWidth}
				>
					{pending ? 'Signing in…' : 'Sign In'}
				</Button>
			</div>
		</form>
	);
}
