interface ColorDotProps {
  color: string;
  size?: 'xs' | 'sm' | 'md';
}

const SIZE_CLASSES: Record<NonNullable<ColorDotProps['size']>, string> = {
  xs: 'h-2 w-2',
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
};

export function ColorDot({ color, size = 'sm' }: ColorDotProps) {
  return (
    <span
      aria-hidden="true"
      className={`${SIZE_CLASSES[size]} shrink-0 rounded-full border border-black/20 dark:border-white/25`}
      style={{ backgroundColor: color }}
    />
  );
}
