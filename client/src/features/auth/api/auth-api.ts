import api from '@/lib/axios';
import type { RegisterInput } from '@/schemas/auth';
import type { RegisterResponse } from '../types';

export async function registerUser(
  data: Omit<RegisterInput, 'confirmPassword'>,
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', data);
  return response.data;
}
