import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackToLogin() {
  return (
    <Link
      href="/login"
      className="mt-4 flex cursor-pointer items-center justify-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-300"
    >
      <ArrowLeft size={14} />
      Back to Login
    </Link>
  );
}
