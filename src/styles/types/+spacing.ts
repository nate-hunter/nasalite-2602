export const spacingSizeMap = {
	none: '0rem',
	xs: '0.125rem',
	sm: '0.25rem',
	md: '0.5rem',
	lg: '1rem',
	xl: '2rem',
	xxl: '4rem',
} as const;

export const spacingRatio = 1.618;
export const spacingBase = 1;
const sp0 = spacingBase;
const sp1 = sp0 * spacingRatio;
const sp2 = sp1 * spacingRatio;
const sp3 = sp2 * spacingRatio;
const sp4 = sp3 * spacingRatio;
const sp5 = sp4 * spacingRatio;
const spNeg1 = sp0 / spacingRatio;
const spNeg2 = spNeg1 / spacingRatio;
const spNeg3 = spNeg2 / spacingRatio;
const spNeg4 = spNeg3 / spacingRatio;
const spNeg5 = spNeg4 / spacingRatio;

export const spacingTokenMap = {
	sp5n: `${spNeg5}rem`,
	sp4n: `${spNeg4}rem`,
	sp3n: `${spNeg3}rem`,
	sp2n: `${spNeg2}rem`,
	sp1n: `${spNeg1}rem`,
	sp0: `${sp0}rem`,
	sp1: `${sp1}rem`,
	sp2: `${sp2}rem`,
	sp3: `${sp3}rem`,
	sp4: `${sp4}rem`,
	sp5: `${sp5}rem`,
} as const;

export const spacingScaleMap = {
	sp025: '0.125rem',
	sp050: '0.25rem',
	sp075: '0.375rem',
	sp100: '0.5rem',
	sp150: '0.75rem',
	sp200: '1rem',
	sp250: '1.25rem',
	sp300: '1.5rem',
	sp400: '2rem',
	sp500: '2.5rem',
	sp600: '3rem',
	sp800: '4rem',
	sp1000: '5rem',
	spNeg025: '-0.125rem',
	spNeg050: '-0.25rem',
	spNeg075: '-0.375rem',
	spNeg100: '-0.5rem',
	spNeg150: '-0.75rem',
	spNeg200: '-1rem',
	spNeg250: '-1.25rem',
	spNeg300: '-1.5rem',
	spNeg400: '-2rem',
} as const;

export const spacingMap = {
	...spacingSizeMap,
	...spacingTokenMap,
	...spacingScaleMap,
} as const;

export const fractionMap = {
	'1/8': '1fr 7fr',
	'1/4': '1fr 3fr',
	'1/3': '1fr 2fr',
	'1/2': '1fr 1fr',
	'2/3': '2fr 1fr',
	'3/4': '3fr 1fr',
	'auto-start': 'auto 1fr',
	'auto-end': '1fr auto',
} as const;

export const justifyAlignMap = {
	start: 'flex-start',
	end: 'flex-end',
	center: 'center',
} as const;

export const stretchMap = {
	all: '> * { flex: 1 }',
	start: '> :first-child { flex: 1 }',
	end: '> :last-child { flex: 1 }',
} as const;

// TODO: Remove any types not used.

export type SpacingMap = typeof spacingMap;
export type SpacingMapKey = keyof typeof spacingMap;

export type FractionMap = typeof fractionMap;
export type FractionMapKey = keyof typeof fractionMap;

export type JustifyAlignMap = typeof justifyAlignMap;
export type JustifyAlignMapKey = keyof typeof justifyAlignMap;

export type StretchMap = typeof stretchMap;
export type StretchMapKey = keyof typeof stretchMap;

export type Unit =
	| 'vmin'
	| 'vmax'
	| 'vh'
	| 'vw'
	| '%'
	| 'ch'
	| 'ex'
	| 'em'
	| 'rem'
	| 'in'
	| 'cm'
	| 'mm'
	| 'pt'
	| 'pc'
	| 'px';

export type SizeUnit = `${number}${Unit}`;

export type PaddedSpace =
	| SpacingMapKey
	| SizeUnit
	| number
	| Array<SpacingMapKey | SizeUnit | number>;

export type SizeKeyword =
	| 'auto'
	| 'inherit'
	| 'none'
	| 'min-content'
	| 'max-content'
	| 'fit-content';

export type CSSLength = SizeKeyword;

export type GapSpace = SpacingMapKey | number | SizeUnit;
