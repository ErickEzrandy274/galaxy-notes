import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().max(500).optional().or(z.literal('')),
});

export const profileOAuthSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  bio: z.string().max(500).optional().or(z.literal('')),
});

const passwordRules = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordRules,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileOAuthInput = z.infer<typeof profileOAuthSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
