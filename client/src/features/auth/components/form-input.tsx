import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leftIcon?: LucideIcon;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, leftIcon: LeftIcon, className, id, ...props }, ref) => {
    return (
      <label>
        <span className="block text-sm font-medium text-zinc-300">
          {label}
        </span>
        <span className="relative block">
          {LeftIcon && (
            <LeftIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
          )}
          <input
            ref={ref}
            id={id}
            className={`mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 ${LeftIcon ? 'pl-10' : ''} ${props.readOnly ? 'cursor-default opacity-70' : ''} ${className ?? ''}`}
            {...props}
          />
        </span>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </label>
    );
  },
);

FormInput.displayName = 'FormInput';
