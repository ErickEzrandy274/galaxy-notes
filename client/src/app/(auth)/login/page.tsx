import type { Metadata } from 'next';
import { AuthBranding, LoginForm } from '@/features/auth';
import type { AuthBrandingConfig } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Galaxy Notes account',
};

const loginBranding: AuthBrandingConfig = {
  headline: 'Capture your ideas, anywhere, anytime.',
  subtitle:
    'Organize, collaborate, and share notes with your team in real-time.',
  features: [
    'Real-time collaboration',
    'Smart tagging & search',
    'Version history tracking',
  ],
};

export default function LoginPage() {
  return (
    <>
      <AuthBranding config={loginBranding} />
      <section className="flex w-full items-center justify-center bg-[#090908] p-8 lg:w-1/2">
        <LoginForm />
      </section>
    </>
  );
}
