type LogoMarkProps = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 24, className }: LogoMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9.4 4.6h8.7c.9 0 1.7.5 2.1 1.3l5.3 10.2c.5 1-.2 2.2-1.3 2.2h-5.6v7.4c0 .9-1.1 1.4-1.8.8l-4.4-3.6H9.4c-1.5 0-2.8-1.2-2.8-2.8V7.4c0-1.5 1.3-2.8 2.8-2.8Z"
        stroke="currentColor"
        strokeWidth="2.05"
        strokeLinejoin="round"
      />
      <path
        d="M11.3 13.1 13.9 15.6 19.4 9.8"
        stroke="currentColor"
        strokeWidth="2.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
