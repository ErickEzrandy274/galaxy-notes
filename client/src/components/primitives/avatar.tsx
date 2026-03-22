const sizeStyles = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]' },
  sm: { container: 'h-7 w-7', text: 'text-[10px]' },
  md: { container: 'h-8 w-8', text: 'text-xs' },
  lg: { container: 'h-10 w-10', text: 'text-sm' },
  xl: { container: 'h-24 w-24', text: 'text-3xl' },
} as const;

interface AvatarProps {
  src?: string | null;
  initials: string;
  size?: keyof typeof sizeStyles;
  className?: string;
}

export function Avatar({
  src,
  initials,
  size = 'md',
  className = '',
}: AvatarProps) {
  const { container, text } = sizeStyles[size];

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`rounded-full object-cover ${container} ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-primary font-bold text-primary-foreground ${container} ${text} ${className}`}
    >
      {initials}
    </span>
  );
}
