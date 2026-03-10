import { type IconProps } from '../+types';

export function FilterIcon({ size = 24, strokeWidth = 2, ...props }: Partial<IconProps>) {
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
      <polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'></polygon>
    </svg>
  );
}
