'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
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
    } catch {
      // Axios interceptor shows error toast with request ID
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading };
}
