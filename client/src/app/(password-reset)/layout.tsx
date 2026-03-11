export default function PasswordResetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090908] p-4">
      {children}
    </main>
  );
}
