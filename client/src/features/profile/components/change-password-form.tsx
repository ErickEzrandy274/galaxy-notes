'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { changePasswordSchema, type ChangePasswordInput } from '@/schemas/profile';
import { generatePassword } from '@/features/auth/utils/generate-password';
import { useChangePassword } from '../hooks/use-profile';

export function ChangePasswordForm() {
  const { mutate, isPending } = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = (data: ChangePasswordInput) => {
    mutate(data, { onSuccess: () => reset() });
  };

  const handleGenerate = () => {
    const pw = generatePassword(16);
    setValue('newPassword', pw, { shouldValidate: true });
    setValue('confirmNewPassword', pw, { shouldValidate: true });
    setShowNew(true);
    setShowConfirm(true);
  };

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Change Password
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <label>
          <p className="block text-sm font-medium text-foreground">
            Current Password
          </p>
          <section className="relative mt-1.5 block">
            <input
              type={showCurrent ? 'text' : 'password'}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 pr-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter current password"
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </section>
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.currentPassword.message}</p>
          )}
        </label>

        <label>
          <p className="block text-sm font-medium text-foreground">
            New Password
          </p>
          <section className="relative mt-1.5 block">
            <input
              type={showNew ? 'text' : 'password'}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 pr-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter new password"
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </section>
          {errors.newPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </label>

        <label>
          <p className="block text-sm font-medium text-foreground">
            Confirm New Password
          </p>
          <section className="relative mt-1.5 block">
            <input
              type={showConfirm ? 'text' : 'password'}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 pr-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Confirm new password"
              {...register('confirmNewPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </section>
          {errors.confirmNewPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.confirmNewPassword.message}</p>
          )}
        </label>

        <section className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Min 12 characters, mixed case, numbers &amp; special characters
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            className="cursor-pointer text-sm font-medium text-primary hover:underline"
          >
            Generate password!
          </button>
        </section>

        <button
          type="submit"
          disabled={!isDirty || isPending}
          className="cursor-pointer rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </section>
  );
}
