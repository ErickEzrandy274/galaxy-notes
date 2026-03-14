'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { registerSchema, type RegisterInput } from '@/schemas/auth';
import { useRegister } from '../hooks/use-register';
import { OAuthButtons } from './oauth-buttons';
import { PasswordInput } from './password-input';
import { generatePassword } from '../utils/generate-password';

interface RegisterFormProps {
  defaultEmail?: string;
  inviteToken?: string;
}

export function RegisterForm({ defaultEmail, inviteToken }: RegisterFormProps) {
  const { register: submitRegister, isLoading } = useRegister();
  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: defaultEmail ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setValue('password', password);
    setValue('confirmPassword', password);
    trigger(['password', 'confirmPassword']);
    navigator.clipboard.writeText(password).then(
      () => toast.success('Password generated and copied to clipboard!'),
      () => toast.success('Password generated! Make sure to save it.'),
    );
  };

  return (
    <section className="w-full max-w-md">
      <h1 className="text-3xl font-bold text-white">Create an account</h1>
      <p className="mt-2 text-zinc-400">Join Galaxy Notes today</p>

      <form
        onSubmit={handleSubmit((data) => submitRegister(data, inviteToken))}
        className="flex flex-col gap-4 mt-8"
      >
        {/* First Name + Last Name */}
        <fieldset className="grid grid-cols-2 gap-4">
          <label>
            <span className="block text-sm font-medium text-zinc-300">
              First Name
            </span>
            <input
              id="firstName"
              type="text"
              placeholder="John"
              {...register('firstName')}
              className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.firstName.message}
              </p>
            )}
          </label>
          <label>
            <span className="block text-sm font-medium text-zinc-300">
              Last Name
            </span>
            <input
              id="lastName"
              type="text"
              placeholder="Doe"
              {...register('lastName')}
              className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.lastName.message}
              </p>
            )}
          </label>
        </fieldset>

        {/* Email */}
        <label>
          <span
            className="block text-sm font-medium text-zinc-300"
          >
            Email
          </span>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            readOnly={!!defaultEmail}
            {...register('email')}
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 read-only:cursor-not-allowed read-only:opacity-60"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </label>

        {/* Password */}
        <fieldset>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-300"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            placeholder="Create a strong password"
            {...register('password')}
            error={errors.password?.message}
          />
          <p className="mt-1.5 text-right">
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-sm cursor-pointer text-purple-400 underline hover:text-purple-300"
            >
              Generate password
            </button>
          </p>
        </fieldset>

        {/* Confirm Password */}
        <label>
          <span
            className="block text-sm font-medium text-zinc-300"
          >
            Confirm Password
          </span>
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm your password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full cursor-pointer rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      {/* Divider */}
      <span className="my-6 flex items-center gap-3" role="separator">
        <hr className="flex-1 border-zinc-700" />
        <span className="text-sm text-zinc-500">OR</span>
        <hr className="flex-1 border-zinc-700" />
      </span>

      <OAuthButtons />

      <p className="mt-8 text-center text-sm text-zinc-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="cursor-pointer font-medium text-purple-400 hover:text-purple-300"
        >
          Sign In
        </Link>
      </p>
    </section>
  );
}
