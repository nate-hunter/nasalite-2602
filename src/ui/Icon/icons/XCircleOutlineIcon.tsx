import { type IconProps } from '../+types';

export function XCircleOutlineIcon({
  size = '200px',
  strokeWidth = 2,
  ...props
}: Partial<IconProps>) {
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
      className='icon x-outline'
      {...props}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
      ></path>
    </svg>
  );
}
