import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		// Local Supabase runs on localhost; next/image cannot proxy private IPs (BUG-003).
		// Set NEXT_PUBLIC_IMAGE_UNOPTIMIZED=true in .env.local for local dev only.
		unoptimized: process.env.NEXT_PUBLIC_IMAGE_UNOPTIMIZED === 'true',
		remotePatterns: [
			// Local Supabase - public objects
			{
				protocol: 'http',
				hostname: '127.0.0.1',
				port: '54321',
				pathname: '/storage/v1/object/public/**',
			},
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '54321',
				pathname: '/storage/v1/object/public/**',
			},
			// Local Supabase - signed URLs
			{
				protocol: 'http',
				hostname: '127.0.0.1',
				port: '54321',
				pathname: '/storage/v1/object/sign/**',
			},
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '54321',
				pathname: '/storage/v1/object/sign/**',
			},
			// Remote Supabase - public objects
			{
				protocol: 'https',
				hostname: '*.supabase.co',
				pathname: '/storage/v1/object/public/**',
			},
			// Remote Supabase - signed URLs
			{
				protocol: 'https',
				hostname: '*.supabase.co',
				pathname: '/storage/v1/object/sign/**',
			},
			{
				protocol: 'https',
				hostname: 'ik.imagekit.io',
				pathname: '/tig3rm4c/LandN/**',
			},
		],
	},
};

export default nextConfig;
