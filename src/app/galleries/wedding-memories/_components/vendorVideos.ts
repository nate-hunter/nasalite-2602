export type VendorVideo = {
	id: number;
	title: string;
	url: string;
	cite?: string;
	cite_url?: string;
	thumbnail?: string;
};

export const VENDOR_VIDEOS: Array<VendorVideo> = [
	{
		id: 1,
		title: 'Vintage Film',
		url: 'https://youtu.be/H7WUONmjghU',
		cite: 'Pono Grace',
		cite_url: 'https://www.ponograce.com/',
	},
	{
		id: 2,
		title: 'Super 8',
		url: 'https://youtu.be/_W77OgthovA',
		cite: 'Pono Grace',
		cite_url: 'https://www.ponograce.com/',
	},
	{
		id: 3,
		title: 'Teaser',
		url: 'https://youtu.be/I2JRM_pLzOY',
		cite: 'Pono Grace',
		cite_url: 'https://www.ponograce.com/',
	},
];
