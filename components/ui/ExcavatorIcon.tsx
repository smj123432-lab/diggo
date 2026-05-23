interface ExcavatorIconProps {
  className?: string;
}

export function ExcavatorIcon({ className }: ExcavatorIconProps) {
  return (
    <svg viewBox="0 0 36 26" fill="currentColor" className={className}>
      <rect x="1" y="19" width="18" height="5" rx="2.5" />
      <rect x="3" y="13" width="13" height="7" rx="0.5" />
      <path d="M5 7 L5 14 L13 14 L14.5 7 Z" />
      <path d="M13 8.5 L24 2 L25.5 4.5 L14.5 11 Z" />
      <path d="M24.5 2.5 L28.5 11 L26.5 11.8 L22.5 3 Z" />
      <path d="M26.5 11 L31 11 L30 16.5 L26 15.5 Z" />
    </svg>
  );
}
