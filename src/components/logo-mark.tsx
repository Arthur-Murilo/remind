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
      <defs>
        <linearGradient id="remindMarkGrad" x1="0" y1="16" x2="32" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00d2ff" />
          <stop offset="1" stopColor="#007cff" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#remindMarkGrad)" />
      <path
        d="M16 7.2c-3.1 0-5.2 2.1-5.2 5.4v4.1l-1.7 2.4c-.4.5-.1 1.3.5 1.3h13c.6 0 1-.8.5-1.3l-1.7-2.4v-4.1c0-3.3-2.1-5.4-5.4-5.4Z"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path d="M13.6 21.6a2.4 2.4 0 0 0 4.8 0" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
      <path
        d="M22.2 20.2v4.4M20 22.4h4.4"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
