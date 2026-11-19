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
        className="h-[72%] w-[72%]"
        fill="none"
        stroke="currentColor"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 136 382 L 250 120 L 296 224" />
        <path d="M 334 314 L 364 382" />
        <path d="M 196 290 L 250 342 L 382 194" />
      </svg>
    </span>
  );
}
