'use client';

interface PermissionBadgeProps {
  permission: 'READ' | 'WRITE';
}

const config = {
  READ: { label: 'Read Only', className: 'bg-blue-500/10 text-blue-600' },
  WRITE: { label: 'Can Edit', className: 'bg-green-500/10 text-green-600' },
};

export function PermissionBadge({ permission }: PermissionBadgeProps) {
  const { label, className } = config[permission];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
