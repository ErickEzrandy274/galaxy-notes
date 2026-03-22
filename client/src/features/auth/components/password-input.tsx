'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <span className="block">
        <span className="relative block">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 pr-10 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 ${className ?? ''}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[60%] -translate-y-1/2 cursor-pointer text-zinc-500 hover:text-zinc-300"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </span>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
