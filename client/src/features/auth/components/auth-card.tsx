interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <section
      className={`w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 ${className ?? ''}`}
    >
      {children}
    </section>
  );
}
