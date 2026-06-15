import 'server-only';

import ImageKit from 'imagekit';

import { getImageKitPrivateKey, imagekitpubkey, imagekiturl } from '@/lib/config';

/** Node ImageKit SDK — authentication, signing, and server operations only. */
export const imagekit = new ImageKit({
	publicKey: imagekitpubkey,
	privateKey: getImageKitPrivateKey(),
	urlEndpoint: imagekiturl,
});

export const imagekitConfig = {
	publicKey: imagekitpubkey,
	urlEndpoint: imagekiturl,
	authenticationEndpoint: '/api/imagekit-auth',
};

export function validateImageKitConfig(): void {
	const required = [
		'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY',
		'IMAGEKIT_PRIVATE_KEY',
		'NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT',
	];

	const missing = required.filter((key) => !process.env[key]);
	if (missing.length > 0) {
		throw new Error(`Missing ImageKit environment variables: ${missing.join(', ')}`);
	}
}
