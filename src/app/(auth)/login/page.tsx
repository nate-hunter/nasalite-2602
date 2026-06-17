import { Suspense } from 'react';
import MagicLinkLoginForm from './MagicLinkLogin';

export default function AuthPage() {
	return (
		<div>
			<h1>Auth Page</h1>
			<Suspense>
				<MagicLinkLoginForm />
			</Suspense>
		</div>
	);
}
