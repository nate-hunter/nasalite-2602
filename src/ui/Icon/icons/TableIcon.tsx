import { type IconProps } from '../+types';

export function TableIcon({ size = 24, strokeWidth = 2, ...props }: Partial<IconProps>) {
  return (
    <svg
      viewBox='0 0 24 24'
      height={size}
      width={size}
      fill='none'
      stroke='currentColor'
      strokeWidth={strokeWidth}
      strokeLinecap='round'
      strokeLinejoin='round'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <line x1='8' y1='6' x2='21' y2='6'></line>
      <line x1='8' y1='12' x2='21' y2='12'></line>
      <line x1='8' y1='18' x2='21' y2='18'></line>
      <line x1='3' y1='6' x2='3.01' y2='6'></line>
      <line x1='3' y1='12' x2='3.01' y2='12'></line>
      <line x1='3' y1='18' x2='3.01' y2='18'></line>
    </svg>
  );
}
