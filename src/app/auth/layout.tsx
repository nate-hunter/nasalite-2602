// NOTE: Currently designed for testing registering + loggin in users

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '1rem' }}>{children}</div>;
}
