'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/* ── Trigger: MoreHorizontal icon button ── */
export function ActionMenuTrigger() {
  return (
    <DropdownMenuPrimitive.Trigger asChild>
      <button
        type="button"
        className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal size={16} />
      </button>
    </DropdownMenuPrimitive.Trigger>
  );
}

/* ── Content wrapper ── */
interface ActionMenuContentProps {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  minWidth?: string;
}

export function ActionMenuContent({
  children,
  align = 'end',
  minWidth = 'min-w-[160px]',
}: ActionMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        className={`z-50 rounded-lg border border-border bg-card p-1 shadow-lg ${minWidth}`}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

/* ── Menu Item ── */
interface ActionMenuItemProps {
  icon?: LucideIcon;
  label: string;
  destructive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function ActionMenuItem({
  icon: Icon,
  label,
  destructive = false,
  onClick,
  disabled,
}: ActionMenuItemProps) {
  const base =
    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none';
  const variant = destructive
    ? 'text-destructive hover:bg-destructive/10'
    : 'text-foreground hover:bg-muted';

  return (
    <DropdownMenuPrimitive.Item
      className={`${base} ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={14} />}
      {label}
    </DropdownMenuPrimitive.Item>
  );
}

/* ── Separator ── */
export function ActionMenuSeparator() {
  return (
    <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />
  );
}

/* ── Re-export Root for convenience ── */
export const ActionMenu = DropdownMenuPrimitive.Root;
