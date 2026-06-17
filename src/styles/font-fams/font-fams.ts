import { Playfair_Display, Sono } from 'next/font/google';
import localFont from 'next/font/local';

const playfairDisplay = Playfair_Display({
	variable: '--font-playfair',
	subsets: ['latin'],
	display: 'swap',
});

const sonoMono = Sono({
	variable: '--font-sono',
	subsets: ['latin'],
	display: 'swap',
});

const wonderUnitSans = localFont({
	src: [
		{
			path: './families/WonderUnitSans/WonderUnitSans-Thin.woff2',
			weight: '100',
			style: 'thin',
		},
		{
			path: './families/WonderUnitSans/WonderUnitSans-Light.woff2',
			weight: '300',
			style: 'light',
		},
		{
			path: './families/WonderUnitSans/WonderUnitSans-Regular.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: './families/WonderUnitSans/WonderUnitSans-Medium.woff2',
			weight: '500',
			style: 'medium',
		},
		{
			path: './families/WonderUnitSans/WonderUnitSans-Bold.woff2',
			weight: '700',
			style: 'bold',
		},
		{
			path: './families/WonderUnitSans/WonderUnitSans-Extrabold.woff2',
			weight: '800',
			style: 'extra-bold',
		},
		{
			path: './families/WonderUnitSans/WonderUnitSans-Black.woff2',
			weight: '900',
			style: 'black',
		},
	],
	fallback: ['sans-serif'],
	variable: '--font-wonder',
	display: 'swap',
});

const thicccboi = localFont({
	src: [
		{
			path: './families/Thicccboi/THICCCBOI-Thin.woff2',
			weight: '100',
			style: 'thin',
		},
		{
			path: './families/Thicccboi/THICCCBOI-Light.woff2',
			weight: '300',
			style: 'light',
		},
		{
			path: './families/Thicccboi/THICCCBOI-Regular.woff2',
			weight: '400',
			style: 'normal',
		},

		{
			path: './families/Thicccboi/THICCCBOI-Medium.woff2',
			weight: '500',
			style: 'medium',
		},
		{
			path: './families/Thicccboi/THICCCBOI-SemiBold.woff2',
			weight: '600',
			style: 'semi-bold',
		},
		{
			path: './families/Thicccboi/THICCCBOI-Bold.woff2',
			weight: '700',
			style: 'bold',
		},
		{
			path: './families/Thicccboi/THICCCBOI-ExtraBold.woff2',
			weight: '800',
			style: 'extra-bold',
		},
		{
			path: './families/Thicccboi/THICCCBOI-Black.woff2',
			weight: '900',
			style: 'black',
		},
		{
			path: './families/Thicccboi/THICCCBOI-ThicccAF.woff2',
			weight: '950',
			style: 'heavy',
		},
	],
	fallback: ['sans-serif'],
	variable: '--font-thicccboi',
	display: 'swap',
});

const garet = localFont({
	src: [
		{
			path: './families/Garet/Garet-Regular.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: './families/Garet/Garet-Bold.woff2',
			weight: '700',
			style: 'bold',
		},
	],
	fallback: ['sans-serif'],
	variable: '--font-garet',
	display: 'swap',
});

const aegean = localFont({
	src: [
		{
			path: './families/TanAegean/TAN-AEGEAN-Regular.ttf',
			weight: '400',
			style: 'normal',
		},
	],
	fallback: ['serif'],
	variable: '--font-aegean',
	display: 'swap',
});

export { wonderUnitSans, thicccboi, playfairDisplay, sonoMono, garet, aegean };
