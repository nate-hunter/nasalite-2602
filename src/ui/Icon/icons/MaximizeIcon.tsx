import { type IconProps } from '../+types';

export function MaximizeIcon({ size = 24, strokeWidth = 2, ...props }: Partial<IconProps>) {
  return (
    <svg
      fill='none'
      stroke='currentColor'
      strokeWidth={strokeWidth}
      viewBox='0 0 24 24'
      height={size}
      width={size}
      strokeLinecap='round'
      strokeLinejoin='round'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d='M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3'></path>
    </svg>
  );
}
