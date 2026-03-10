import { type IconProps } from '../+types';

export function ChevronDownIcon({
  size = '1rem',
  strokeWidth = 2.5,
  ...props
}: Partial<IconProps>) {
  return (
    <svg
      stroke='currentColor'
      fill='currentColor'
      strokeWidth={strokeWidth}
      viewBox='0 0 512 512'
      height={size}
      width={size}
      xmlns='http://www.w3.org/2000/svg'
      className='icon chevron'
      {...props}
    >
      <path d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z'></path>
    </svg>
  );
}

export function ChevronUpIcon({ size = '1rem', strokeWidth = 2.5, ...props }: Partial<IconProps>) {
  return (
    <svg
      stroke='currentColor'
      fill='currentColor'
      strokeWidth={strokeWidth}
      viewBox='0 0 512 512'
      height={size}
      width={size}
      xmlns='http://www.w3.org/2000/svg'
      className='icon chevron'
      style={{ transform: 'rotate(-180deg)' }}
      {...props}
    >
      <path d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z'></path>
    </svg>
  );
}
