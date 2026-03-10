import {
  DM_Sans,
  Gothic_A1,
  Playfair_Display,
  Sono,
} from 'next/font/google';

/** Hero + display type */
const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

/** Monospace */
const sonoMono = Sono({
  variable: '--font-sono',
  subsets: ['latin'],
  display: 'swap',
});

/** Headings + buttons */
const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

/** Body, nav, captions, subtext — everything else */
const gothicA1 = Gothic_A1({
  variable: '--font-gothic',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export { dmSans, gothicA1, playfairDisplay, sonoMono };
