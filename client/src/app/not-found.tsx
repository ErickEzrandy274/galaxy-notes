import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Image
        src="/images/404.svg"
        alt=""
        width={320}
        height={240}
        priority
        className="mb-8"
      />
      <h1 className="text-7xl font-extrabold tracking-tight text-primary">
        404
      </h1>
      <h2 className="mt-3 text-2xl font-semibold text-foreground">
        Page Not Found
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go Home
      </Link>
    </main>
  );
}
