import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </section>
  );
}
