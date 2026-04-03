import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { NotificationStreamProvider } from '@/components/layout/notification-stream-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <section className="flex h-screen flex-col md:flex-row">
      <NotificationStreamProvider />
      <MobileHeader />
      <Sidebar />
      <main className="flex-1 overflow-auto bg-background pb-14 md:pb-0">{children}</main>
      <MobileNav />
    </section>
  );
}
