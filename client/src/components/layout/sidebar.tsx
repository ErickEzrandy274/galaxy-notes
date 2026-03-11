'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Users,
  Bell,
  Trash2,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  MoreVertical,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

const navItems = [
  { href: '/notes', icon: FileText, label: 'My Notes' },
  { href: '/shared', icon: Users, label: 'Shared with Me' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/trash', icon: Trash2, label: 'Trash' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark';

  // TODO: Replace with real notification count from API
  const notificationCount = 0;

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-border bg-card transition-all ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Collapse toggle — edge chevron */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Zone 1: Identity */}
      <header className="flex items-center border-b border-border p-4">
        {collapsed ? (
          <span className="mx-auto text-lg text-primary">✦</span>
        ) : (
          <Link href="/notes" className="cursor-pointer text-lg font-bold">
            <span className="text-foreground">✦ Galaxy </span>
            <span className="text-primary">Notes</span>
          </Link>
        )}
      </header>

      {/* Zone 2: Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          const isNotifications = href === '/notifications';
          return (
            <Link
              key={href}
              href={href}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? label : undefined}
            >
              <span className="relative">
                <Icon size={20} />
                {isNotifications && notificationCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {isNotifications && notificationCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Zone 3: Dark Mode toggle */}
      <section className="border-t border-border p-3">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`flex w-full cursor-pointer items-center ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          {mounted ? (
            isDark ? (
              <Moon size={18} className="text-yellow-400" />
            ) : (
              <Sun size={18} className="text-amber-500" />
            )
          ) : (
            <span className="h-[18px] w-[18px]" />
          )}
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm text-muted-foreground">
                {mounted ? (isDark ? 'Dark Mode' : 'Light Mode') : '\u00A0'}
              </span>
              <span
                className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                  mounted && isDark ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                    mounted && isDark ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
            </>
          )}
        </button>
      </section>

      {/* Zone 4: User info with dropdown */}
      {session?.user && (
        <footer className="border-t border-border p-3">
          <span
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}
          >
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                {collapsed ? (
                  <button className="cursor-pointer" title={session.user.name || 'User'}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {session.user.name?.split(/\s+/).slice(0, 3).map(w => w.charAt(0)).join('').toUpperCase() || 'U'}
                    </span>
                  </button>
                ) : (
                  <button className="flex w-full cursor-pointer items-center gap-3 text-left">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {session.user.name?.split(/\s+/).slice(0, 3).map(w => w.charAt(0)).join('').toUpperCase() || 'U'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {session.user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </span>
                    <MoreVertical size={16} className="shrink-0 text-muted-foreground" />
                  </button>
                )}
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="center"
                  side="top"
                  sideOffset={8}
                  className="z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
                >
                  {/* User info header */}
                  <header className="flex items-center gap-3 border-b border-border bg-muted/50 px-3 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {session.user.name?.split(/\s+/).slice(0, 3).map(w => w.charAt(0)).join('').toUpperCase() || 'U'}
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {session.user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </span>
                  </header>
                  {/* Menu items */}
                  <menu className="p-1">
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/profile"
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-muted"
                      >
                        <User size={16} />
                        Profile
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-muted"
                    >
                      <LogOut size={16} />
                      Log out
                    </DropdownMenu.Item>
                  </menu>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </span>
        </footer>
      )}
    </aside>
  );
}
