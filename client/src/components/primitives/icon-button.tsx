import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

const variantStyles = {
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  destructive: 'text-muted-foreground hover:text-destructive',
} as const;

const sizeStyles = {
  sm: 'p-1 rounded',
  md: 'p-1.5 rounded-md',
  lg: 'h-8 w-8 rounded-md',
} as const;

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  iconSize?: number;
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'sm',
  iconSize = 16,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <Icon size={iconSize} />
    </button>
  );
}
