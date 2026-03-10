import { type IconProps } from '../+types';

export function GridIcon({ size = 24, strokeWidth = 2, ...props }: Partial<IconProps>) {
  return (
    <svg
      stroke='currentColor'
      fill='none'
      strokeWidth={strokeWidth}
      viewBox='0 0 24 24'
      height={size}
      width={size}
      strokeLinecap='round'
      strokeLinejoin='round'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <rect x='3' y='3' width='7' height='7'></rect>
      <rect x='14' y='3' width='7' height='7'></rect>
      <rect x='14' y='14' width='7' height='7'></rect>
      <rect x='3' y='14' width='7' height='7'></rect>
    </svg>
  );
}
