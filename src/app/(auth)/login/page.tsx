import { Suspense } from 'react';
import MagicLinkLoginForm from './MagicLinkLogin';

export default function AuthPage() {
	return (
		<div>
			<Suspense>
				<MagicLinkLoginForm />
			</Suspense>
		</div>
	);
}
