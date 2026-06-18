'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signInWithMagicLink } from '../auth.actions';
import { Button } from '@/ui/Button';
import styles from './page.module.css';
import MailpitDevLink from './_MailpitLink.dev';

export default function MagicLinkLoginForm() {
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState('');

	const error = searchParams.get('error');
	const success = searchParams.get('success');

	const handleSubmit = async (formData: FormData) => {
		setIsLoading(true);
		await signInWithMagicLink(formData);
		setIsLoading(false);
	};

	const getErrorMessage = (errorType: string) => {
		switch (errorType) {
			case 'invalid-email':
				return 'Please enter a valid email address.';
			case 'rate-limited':
				return 'Too many attempts. Please wait a moment before trying again.';
			case 'unknown':
				return 'An error occurred. Please try again.';
			default:
				return 'Something went wrong. Please try again.';
		}
	};

	return (
		<div className={styles.wrapper}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.title}>Sign In</h1>
					<p className={styles.subtitle}>
						We&apos;ll send you a secure link to sign in without a password.
					</p>
				</header>

				<div className={styles.card}>
					<div className={styles.formBlock}>
						<form
							action={handleSubmit}
							noValidate
							aria-label="Magic link sign in"
							className={styles.form}
						>
							{error && (
								<p
									role="alert"
									aria-live="polite"
									className={`${styles.alert} ${styles.alertError}`}
								>
									{getErrorMessage(error)}
								</p>
							)}
							{success && (
								<p
									role="status"
									aria-live="polite"
									className={`${styles.alert} ${styles.alertSuccess}`}
								>
									Magic link sent! Check your email and click the link to sign in.
								</p>
							)}

							<div className={styles.fieldGroupLast}>
								<label htmlFor="magic-email" className={styles.label}>
									Email Address
								</label>
								<input
									id="magic-email"
									name="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="your@email.com"
									autoComplete="email"
									aria-required="true"
									disabled={isLoading}
									className={styles.input}
								/>
							</div>

							<div className={styles.submitWrap}>
								<Button
									type="submit"
									variant="primary"
									loading={isLoading}
									loadingLabel="Sending…"
									disabled={!email}
									className={styles.submitFullWidth}
								>
									Send Magic Link
								</Button>
							</div>
						</form>
					</div>
				</div>

				<footer className={styles.footer}>
					<p className={styles.footerText}>Check your inbox and spam folder for the link.</p>

					{process.env.NODE_ENV === 'development' ? <MailpitDevLink /> : null}
				</footer>
			</div>
		</div>
	);
}
