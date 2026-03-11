'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import type { RegisterInput } from '@/schemas/auth';
import { registerUser } from '../api/auth-api';

export function useRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const register = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const { confirmPassword: _, ...registerData } = data;
      await registerUser(registerData);

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.success('Account created! Please sign in.');
        router.push('/login');
        return;
      }

      toast.success('Account created successfully!');
      router.push('/notes');
      router.refresh();
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          toast.error('This email is already registered');
        } else {
          toast.error(
            error.response?.data?.message || 'Registration failed',
          );
        }
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading };
}
