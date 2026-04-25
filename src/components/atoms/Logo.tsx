interface LogoProps {
  readonly size?: number;
}

export function Logo({ size = 32 }: LogoProps) {
  // Inline shield-mark SVG. Stroke uses currentColor so it inherits
  // text color from any parent context (header, footer, splash).
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 3l11 4v8c0 7-4.5 12-11 14C9.5 27 5 22 5 15V7l11-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M11 16l3.5 3.5L21 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
