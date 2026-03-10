'use client';

import { useState } from 'react';
import { UserLoginForm } from './_components/login-form';
import { UserRegisterForm } from './_components/register-form';
import styles from './page.module.css';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
	const [mode, setMode] = useState<AuthMode>('login');

	return (
		<div className={styles.wrapper}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.title}>Welcome</h1>
					<p className={styles.subtitle}>
						{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
					</p>
				</header>

				<div className={styles.card}>
					<div className={styles.modeToggle} role="tablist" aria-label="Login or register">
						<button
							type="button"
							role="tab"
							aria-selected={mode === 'login'}
							aria-controls="auth-panel"
							id="tab-login"
							className={`${styles.modeToggleButton} ${mode === 'login' ? styles.modeToggleButtonActive : ''}`}
							onClick={() => setMode('login')}
						>
							Login
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={mode === 'register'}
							aria-controls="auth-panel"
							id="tab-register"
							className={`${styles.modeToggleButton} ${mode === 'register' ? styles.modeToggleButtonActive : ''}`}
							onClick={() => setMode('register')}
						>
							Register
						</button>
					</div>

					<div
						id="auth-panel"
						role="tabpanel"
						aria-labelledby={mode === 'login' ? 'tab-login' : 'tab-register'}
					>
						{mode === 'login' && (
							<div className={styles.formBlock}>
								<UserLoginForm className={styles.form} />
							</div>
						)}
						{mode === 'register' && (
							<div className={styles.formBlock}>
								<UserRegisterForm className={styles.form} />
							</div>
						)}
					</div>
				</div>

				<footer className={styles.footer}>
					<p className={styles.footerText}>
						{mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
						<button
							type="button"
							className={styles.footerLink}
							onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
						>
							{mode === 'login' ? 'Register here' : 'Login here'}
						</button>
					</p>
				</footer>
			</div>
		</div>
	);
}
