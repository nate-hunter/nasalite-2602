import { type IconProps } from '../+types';

export function OctagonExclamationIcon({ size = 24, color = 'var(--color-danger-500)', ...props }: Partial<IconProps>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <polygon points='7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2'></polygon>
      <line x1='12' y1='8' x2='12' y2='12'></line>
      <line x1='12' y1='16' x2='12.01' y2='16'></line>
    </svg>
  );
}
