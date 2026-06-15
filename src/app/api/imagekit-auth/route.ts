import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { imagekit, imagekitConfig, validateImageKitConfig } from '@/lib/imagekit/imagekit-server';

/**
 * ImageKit authentication endpoint
 *
 * Returns ImageKit token/signature/expire for client-side uploads.
 * This is required for temporary ImageKit uploads (e.g. HEIC preview pipeline).
 */
export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		validateImageKitConfig();

		// token/signature/expire for the ImageKit client upload REST API
		const authenticationParameters = imagekit.getAuthenticationParameters();

		return NextResponse.json({
			...authenticationParameters,
			publicKey: imagekitConfig.publicKey,
			urlEndpoint: imagekitConfig.urlEndpoint,
			// Extra context for logging / debugging (safe non-secret)
			userId: user.id,
			timestamp: Date.now(),
		});
	} catch (error) {
		console.error('ImageKit authentication error:', error);

		if (
			error instanceof Error &&
			error.message.includes('Missing ImageKit environment variables')
		) {
			return NextResponse.json({ error: 'ImageKit configuration error' }, { status: 500 });
		}

		return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
	}
}

/**
 * OPTIONS handler for CORS support
 * Required for client-side ImageKit uploads
 */
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}
