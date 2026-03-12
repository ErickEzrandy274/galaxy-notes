import Image from 'next/image';
import Link from 'next/link';

interface UnderDevelopmentProps {
  feature: string;
}

export function UnderDevelopment({ feature }: UnderDevelopmentProps) {
  return (
    <section className="flex min-h-full flex-col items-center justify-center px-4 text-center">
      <Image
        src="/images/under-development.svg"
        alt=""
        width={280}
        height={210}
        priority
        className="mb-8"
      />
      <h1 className="text-2xl font-bold text-foreground">
        {feature}
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We&apos;re working hard to bring this feature to life. Stay tuned for
        updates!
      </p>
      <Link
        href="/notes"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to My Notes
      </Link>
    </section>
  );
}
