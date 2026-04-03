import type { LucideIcon } from 'lucide-react';

type AuthIconVariant = 'purple' | 'green' | 'provider';

interface AuthIconProps {
  icon: LucideIcon;
  variant: AuthIconVariant;
}

const variantStyles: Record<AuthIconVariant, string> = {
  purple: 'bg-purple-600/20 text-purple-400',
  green: 'bg-emerald-600/20 text-emerald-400',
  provider: 'bg-zinc-700 text-zinc-300',
};

export function AuthIcon({ icon: Icon, variant }: AuthIconProps) {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full ${variantStyles[variant]}`}
      >
        <Icon size={24} />
      </span>
    </div>
  );
}
