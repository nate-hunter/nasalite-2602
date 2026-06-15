'use client';

import { ImageKitProvider } from '@/lib/imagekit/imagekit-client';
import { imagekiturl } from '@/lib/config';

type ImageKitProviderShellProps = {
	children: React.ReactNode;
};

export function ImageKitProviderShell({ children }: ImageKitProviderShellProps) {
	return (
		<ImageKitProvider urlEndpoint={imagekiturl} transformationPosition="query">
			{children}
		</ImageKitProvider>
	);
}
