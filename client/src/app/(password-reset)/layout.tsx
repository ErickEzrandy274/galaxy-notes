import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function PasswordResetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) {
    redirect('/notes');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090908] p-4">
      {children}
    </main>
  );
}
