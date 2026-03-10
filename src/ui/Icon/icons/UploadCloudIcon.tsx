import { type IconProps } from '../+types';

export function UploadCloudIcon({
  size = 24,
  strokeWidth = 2,
  color = 'currentColor',
  ...props
}: Partial<IconProps>) {
  // return (
  //   <svg
  //     xmlns='http://www.w3.org/2000/svg'
  //     width={size}
  //     height={size}
  //     viewBox='0 0 24 24'
  //     fill='none'
  //     stroke='currentColor'
  //     strokeWidth={strokeWidth}
  //     strokeLinecap='round'
  //     strokeLinejoin='round'
  //     className='icon upload'
  //     {...props}
  //   >
  //     <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
  //     <polyline points='17 8  12 3  7 8'></polyline>

  //     <line x1='12' y1='3' x2='12' y2='15'></line>
  //   </svg>
  // );

  return (
    <svg
      // className={`w-12 h-12 mb-3 ${isDragActive ? 'text-tertiary-dark' : 'text-gray-400'}`}
      fill='none'
      stroke={color}
      width={size}
      height={size}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={strokeWidth}
        d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
      ></path>
    </svg>
  );
}
