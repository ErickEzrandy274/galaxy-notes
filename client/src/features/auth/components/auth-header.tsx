interface AuthHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <header className="mt-5 text-center">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
      )}
    </header>
  );
}
