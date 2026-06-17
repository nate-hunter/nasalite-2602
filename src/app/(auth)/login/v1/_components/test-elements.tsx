'use client';

import { useState } from 'react';

export function TestUserValues() {
	const TEST_EMAIL = 'tiger@example.com';
	const TEST_FULLNAME = new Date(Date.now()).toISOString().slice(0, -5);
	const TEST_PASSWORD = 'tiger1234';
	const [copied, setCopied] = useState<'email' | 'fullname' | 'password' | null>(null);

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			return false;
		}
	}

	async function handleCopy(value: string, kind: 'email' | 'fullname' | 'password') {
		const ok = await copyToClipboard(value);
		if (ok) {
			setCopied(kind);
			setTimeout(() => setCopied(null), 2000);
		}
	}

	return (
		<div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
			<ElementWrapper>
				<span>Test User Email: {TEST_EMAIL}</span>
				<button
					type="button"
					onClick={() => handleCopy(TEST_EMAIL, 'email')}
					aria-label={`Copy test email ${TEST_EMAIL}`}
					style={{ fontSize: '0.75rem' }}
				>
					{copied === 'email' ? 'Copied!' : 'Copy'}
				</button>
			</ElementWrapper>
			<ElementWrapper>
				<span>Test User Fullname: {TEST_FULLNAME}</span>
				<button
					type="button"
					onClick={() => handleCopy(TEST_FULLNAME, 'fullname')}
					aria-label={`Copy test fullname ${TEST_FULLNAME}`}
					style={{ fontSize: '0.75rem' }}
				>
					{copied === 'fullname' ? 'Copied!' : 'Copy'}
				</button>
			</ElementWrapper>
			<ElementWrapper>
				<span>Test User PWD: {TEST_PASSWORD}</span>
				<button
					type="button"
					onClick={() => handleCopy(TEST_PASSWORD, 'password')}
					aria-label="Copy test password"
					style={{ fontSize: '0.75rem' }}
				>
					{copied === 'password' ? 'Copied!' : 'Copy'}
				</button>
			</ElementWrapper>
		</div>
	);
}

function ElementWrapper({ children }: { children: React.ReactNode }) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '0.5rem',
				flexWrap: 'wrap',
				minWidth: 'max-content',
				padding: '2px 4px',
				border: '1px solid salmon',
				opacity: '0.65',
			}}
		>
			{children}
		</div>
	);
}
