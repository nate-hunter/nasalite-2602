import { type IconProps } from '../+types';

export function FilterBarsIcon({ size = 24, strokeWidth = 0, ...props }: Partial<IconProps>) {
  return (
    <svg
      stroke='currentColor'
      fill='currentColor'
      strokeWidth={strokeWidth}
      //   viewBox='0 0 24 24'
      viewBox='0 0 16 16'
      height={size}
      width={size}
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d='M6 12v-1h4v1H6zM4 7h8v1H4V7zm10-4v1H2V3h12z'></path>
    </svg>
  );
}
