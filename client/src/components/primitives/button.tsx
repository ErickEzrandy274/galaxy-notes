import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold',
  'primary-purple':
    'bg-purple-600 text-white hover:bg-purple-700 font-semibold',
  outline:
    'border border-border text-foreground hover:bg-muted font-medium',
  'outline-muted':
    'border border-border text-muted-foreground hover:bg-muted hover:text-foreground font-medium',
  ghost:
    'text-muted-foreground hover:bg-muted hover:text-foreground font-medium',
  destructive:
    'bg-destructive text-white hover:bg-destructive/90 font-semibold',
  'destructive-outline':
    'border border-border text-destructive hover:bg-destructive/10 font-medium',
  'ghost-primary':
    'text-primary hover:bg-primary/10 font-medium',
} as const;

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-sm gap-2',
} as const;

type ButtonVariant = keyof typeof variantStyles;
type ButtonSize = keyof typeof sizeStyles;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <Loader2
          className="animate-spin"
          size={size === 'sm' ? 14 : 16}
        />
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
