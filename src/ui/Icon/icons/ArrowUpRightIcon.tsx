import { type IconProps } from '../+types';

export function ArrowUpRightIcon({ size = 24, strokeWidth = 2, ...props }: Partial<IconProps>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      strokeWidth={strokeWidth}
      viewBox='0 0 24 24'
      height={size}
      width={size}
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <line x1='7' y1='17' x2='17' y2='7'></line>
      <polyline points='7 7 17 7 17 17'></polyline>
    </svg>
  );
}
