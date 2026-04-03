'use client';

interface PasswordStrengthBarProps {
  password: string;
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

interface StrengthConfig {
  label: string;
  color: string;
  width: string;
}

const strengthConfigs: Record<StrengthLevel, StrengthConfig> = {
  weak: { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' },
  fair: { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4' },
  good: { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' },
  strong: { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' },
};

function getStrength(password: string): StrengthLevel {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'fair';
  if (score <= 4) return 'good';
  return 'strong';
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  if (!password) return null;

  const strength = getStrength(password);
  const config = strengthConfigs[strength];

  return (
    <div className="mt-2" role="status" aria-label={`Password strength: ${config.label}`}>
      <div className="block h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
        <div
          className={`block h-full rounded-full transition-all duration-300 ${config.color} ${config.width}`}
        />
      </div>
      <p className={`mt-1 text-right text-xs ${config.color.replace('bg-', 'text-')}`}>
        {config.label}
      </p>
    </div>
  );
}
