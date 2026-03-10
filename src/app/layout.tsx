import type { Metadata } from 'next';
import { dmSans, gothicA1, playfairDisplay, sonoMono } from '@/styles/fonts';
import './globals.css';
import Navbar from '@/ui/Navbar/Navbar';

export const metadata: Metadata = {
	title: 'N + L',
	description: 'Nate and Lisa',
};

const fontClassNames = [
	playfairDisplay.variable,
	sonoMono.variable,
	dmSans.variable,
	gothicA1.variable,
].join(' ');

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={fontClassNames}>
				<Navbar />
				{children}
			</body>
		</html>
	);
}
