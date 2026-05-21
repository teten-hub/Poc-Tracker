import React from 'react';

interface TorIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export default function TorIcon({ className, size = 24, ...props }: TorIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer bulb layer */}
      <path d="M12 3c-1.5 3.5-5 6.5-5 11a5 5 0 0 0 10 0c0-4.5-3.5-7.5-5-11z" />
      {/* Middle layer */}
      <path d="M12 6.5c-0.9 2-3 4.5-3 7.5a3 3 0 0 0 6 0c0-3-2.1-5.5-3-7.5z" />
      {/* Inner core layer */}
      <path d="M12 10c-0.3 1-1 2-1 4a1 1 0 0 0 2 0c0-2-0.7-3-1-4z" />
      {/* Small root elements at the bottom */}
      <path d="M12 19v1.5" />
      <path d="M9.5 19c-0.5 1-1 1-1.5 1.5" />
      <path d="M14.5 19c0.5 1 1 1 1.5 1.5" />
    </svg>
  );
}
