import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

/* ── Form Label ── */
interface FormLabelProps {
  htmlFor?: string;
  children: ReactNode;
}

export function FormLabel({ htmlFor, children }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-foreground"
    >
      {children}
    </label>
  );
}

/* ── Form Error ── */
interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-destructive">{message}</p>;
}

/* ── Text Input ── */
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ error, className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`mt-1.5 w-full rounded-lg border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 ${
          error
            ? 'border-destructive focus:border-destructive focus:ring-destructive'
            : 'border-border focus:border-primary focus:ring-primary'
        } disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
        {...props}
      />
    );
  },
);

/* ── Textarea ── */
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ error, className = '', ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`mt-1.5 w-full resize-none rounded-lg border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 ${
          error
            ? 'border-destructive focus:border-destructive focus:ring-destructive'
            : 'border-border focus:border-primary focus:ring-primary'
        } disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
        {...props}
      />
    );
  },
);

/* ── Composed FormField ── */
interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div>
      <FormLabel htmlFor={htmlFor}>{label}</FormLabel>
      {children}
      <FormError message={error} />
    </div>
  );
}
