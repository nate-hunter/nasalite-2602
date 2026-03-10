import { type IconProps } from '../+types';

export function DownloadIcon({ size = 24, strokeWidth = 2, ...props }: Partial<IconProps>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={strokeWidth}
      strokeLinecap='round'
      strokeLinejoin='round'
      className='icon upload'
      {...props}
    >
      <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
      <polyline points='17 10 12 15 7 10'></polyline>
      <line x1='12' y1='3' x2='12' y2='15'></line>
    </svg>
  );
}
