import type { Metadata } from 'next';
import { AuthBranding, RegisterForm } from '@/features/auth';
import type { AuthBrandingConfig } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Create Account - Galaxy Notes',
  description: 'Create your Galaxy Notes account',
};

const registerBranding: AuthBrandingConfig = {
  headline: 'Start your journey with Galaxy Notes.',
  subtitle:
    'Create an account and start organizing your notes in seconds.',
  features: [
    'Free to get started',
    'Collaborate with your team',
    'Secure & private',
  ],
};

interface RegisterPageProps {
  searchParams: Promise<{ email?: string; invite?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <>
      <AuthBranding config={registerBranding} />
      <section className="flex w-full items-center justify-center bg-[#090908] p-8 lg:w-1/2">
        <RegisterForm defaultEmail={params.email} inviteToken={params.invite} />
      </section>
    </>
  );
}
