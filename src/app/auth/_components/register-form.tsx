'use client';

import { useActionState } from 'react';
import { Button } from '@/ui/Button';
import { registeruserwithemailpassword, type AuthFormState } from '../auth.actions';
import styles from '../page.module.css';

const initialState: AuthFormState = null;

export type UserRegisterFormProps = {
	className?: string;
};

export function UserRegisterForm({ className }: UserRegisterFormProps) {
	const [state, formAction, pending] = useActionState(registeruserwithemailpassword, initialState);

	return (
		<form
			action={formAction}
			noValidate
			aria-label="Registration form"
			className={[styles.form, className].filter(Boolean).join(' ')}
		>
			{state?.success === false && state.error && (
				<p role="alert" aria-live="polite" className={`${styles.alert} ${styles.alertError}`}>
					{state.error}
				</p>
			)}
			{state?.success === true && state.message && (
				<p role="status" aria-live="polite" className={`${styles.alert} ${styles.alertSuccess}`}>
					{state.message}
				</p>
			)}

			<div className={styles.fieldGroup}>
				<label htmlFor="register-email" className={styles.label}>
					Email
				</label>
				<input
					id="register-email"
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

			<div className={styles.fieldGroup}>
				<label htmlFor="register-fullname" className={styles.label}>
					Full Name (Optional)
				</label>
				<input
					id="register-fullname"
					type="text"
					placeholder="John Doe"
					name="fullname"
					autoComplete="name"
					disabled={pending}
					className={styles.input}
				/>
				{/* <span className={styles.hint}>We'll use this to personalize your experience</span> */}
			</div>

			<div className={styles.fieldGroup}>
				<label htmlFor="register-password" className={styles.label}>
					Password
				</label>
				<input
					id="register-password"
					type="password"
					name="password"
					placeholder="Create a password"
					required
					autoComplete="new-password"
					aria-required="true"
					disabled={pending}
					className={styles.input}
				/>
			</div>

			<div className={styles.fieldGroupLast}>
				<label htmlFor="register-password-confirm" className={styles.label}>
					Confirm Password
				</label>
				<input
					id="register-password-confirm"
					type="password"
					name="confirmpassword"
					placeholder="Re-enter your password"
					required
					autoComplete="new-password"
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
					{pending ? 'Signing up…' : 'Create Account'}
				</Button>
			</div>
		</form>
	);
}
