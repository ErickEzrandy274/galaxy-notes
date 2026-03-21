'use client';

import { Button } from '@/components/primitives';

interface AuthSubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function AuthSubmitButton({
  children,
  loading,
  disabled,
  className,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="primary-purple"
      fullWidth
      loading={loading}
      loadingText="Please wait..."
      disabled={disabled}
      className={className ?? ''}
      {...props}
    >
      {children}
    </Button>
  );
}
