interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = 'h-7 w-7' }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-lg ${className}`}
      style={{
        backgroundColor: 'var(--accent)',
        color: 'var(--accent-fg)',
      }}
    >
      <svg
        viewBox="0 0 512 512"
        className="h-[76%] w-[76%]"
        fill="none"
        stroke="currentColor"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g transform="translate(-4 3)">
          <path d="M 144 378 L 252 128 L 294 224" />
          <path d="M 332 312 L 360 378" />
          <path d="M 202 288 L 252 336 L 376 198" />
        </g>
      </svg>
    </span>
  );
}
