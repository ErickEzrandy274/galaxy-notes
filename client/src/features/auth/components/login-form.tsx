'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { useLogin } from '../hooks/use-login';
import { OAuthButtons } from './oauth-buttons';
import { PasswordInput } from './password-input';

export function LoginForm() {
  const { login, isLoading } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <section className="w-full max-w-md">
      <h1 className="text-3xl font-bold text-white">Welcome back</h1>
      <p className="mt-2 text-zinc-400">
        Sign in to your account to continue
      </p>

      <form onSubmit={handleSubmit(login)} className="flex flex-col gap-5 mt-8">
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
            {...register('email')}
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </label>

        {/* Password */}
        <fieldset>
          <span className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="cursor-pointer text-sm text-purple-400 hover:text-purple-300"
            >
              Forgot password?
            </Link>
          </span>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            {...register('password')}
            error={errors.password?.message}
          />
        </fieldset>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full cursor-pointer rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
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
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="cursor-pointer font-medium text-purple-400 hover:text-purple-300"
        >
          Sign Up
        </Link>
      </p>
    </section>
  );
}
