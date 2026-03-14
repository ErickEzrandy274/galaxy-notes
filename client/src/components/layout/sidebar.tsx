"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
	RefreshCw,
	MoreVertical,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useUnreadNotificationCount } from "@/features/notes/hooks/use-notifications";
import { useNotificationStream } from "@/features/notes/hooks/use-notification-stream";

const navItems = [
	{ href: "/notes", icon: FileText, label: "My Notes" },
	{ href: "/shared", icon: Users, label: "Shared with Me" },
	{ href: "/notifications", icon: Bell, label: "Notifications" },
	{ href: "/trash", icon: Trash2, label: "Trash" },
];

export function Sidebar() {
	const pathname = usePathname();
	const { data: session } = useSession();
	const [collapsed, setCollapsed] = useState(() => {
		if (typeof window === "undefined") return false;
		try {
			return localStorage.getItem("galaxy-notes-sidebar-collapsed") === "true";
		} catch {
			return false;
		}
	});
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();
	const queryClient = useQueryClient();
	const isFetching = useIsFetching();
	const { data: profile } = useProfile();

	useEffect(() => setMounted(true), []);

	const isDark = theme === "dark";
	const userPhoto = profile?.photo ?? null;
	const userInitials =
		session?.user?.name
			?.split(/\s+/)
			.slice(0, 3)
			.map((w) => w.charAt(0))
			.join("")
			.toUpperCase() || "U";

	const { data: unreadData } = useUnreadNotificationCount();
	const notificationCount = unreadData?.count ?? 0;

	// SSE: push-based real-time notification updates
	useNotificationStream();

	return (
		<Tooltip.Provider delayDuration={200}>
		<aside
			className={`relative flex h-screen flex-col border-r border-border bg-card transition-all ${
				collapsed ? "w-16" : "w-60"
			}`}
		>
			{/* Collapse toggle — edge chevron */}
			<button
				onClick={() => {
					const next = !collapsed;
					setCollapsed(next);
					try {
						localStorage.setItem("galaxy-notes-sidebar-collapsed", String(next));
					} catch {}
				}}
				className="absolute -right-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
			>
				{collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
			</button>

			{/* Zone 1: Identity */}
			<header className="flex justify-center items-center border-b border-border p-4">
				<Link
					href="/notes"
					className="cursor-pointer text-2xl font-bold flex gap-2"
				>
					<p className="mx-auto text-yellow-400">✦</p>
					{!collapsed && (
						<>
							<p className="text-foreground">Galaxy</p>
							<p className="text-purple-700">Notes</p>
						</>
					)}
				</Link>
			</header>

			{/* Zone 2: Navigation */}
			<nav className="flex-1 space-y-1 p-2">
				{navItems.map(({ href, icon: Icon, label }) => {
					const isActive = pathname.startsWith(href);
					const isNotifications = href === "/notifications";

					const link = (
						<Link
							key={href}
							href={href}
							className={`relative flex cursor-pointer items-center gap-3 p-3 text-sm transition-colors ${
								isActive
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							} ${collapsed ? "justify-center rounded-full aspect-square" : "rounded-lg"}`}
						>
							{isActive && (
								<span className="absolute -left-2 top-1/2 h-full w-0.5 -translate-y-1/2 rounded-full bg-primary" />
							)}
							<span className="relative">
								<Icon size={20} />
								{collapsed && isNotifications && notificationCount > 0 && (
									<span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
										{notificationCount > 9 ? "9+" : notificationCount}
									</span>
								)}
							</span>
							{!collapsed && (
								<>
									<span className="flex-1">{label}</span>
									{isNotifications && notificationCount > 0 && (
										<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
											{notificationCount > 99 ? "99+" : notificationCount}
										</span>
									)}
								</>
							)}
						</Link>
					);

					if (!collapsed) return <span key={href}>{link}</span>;

					return (
						<Tooltip.Root key={href}>
							<Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									side="right"
									sideOffset={12}
									className="z-50 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-lg"
								>
									{label}
									<Tooltip.Arrow className="fill-border" />
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
					);
				})}
			</nav>

			{/* Zone 3: Refresh + Dark Mode toggle */}
			<section className="flex flex-col gap-1 border-t border-border p-3">
				{collapsed ? (
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<button
								onClick={() => queryClient.invalidateQueries()}
								disabled={isFetching > 0}
								className="flex w-full cursor-pointer items-center justify-center p-2 text-muted-foreground disabled:cursor-default"
							>
								<RefreshCw size={18} className={isFetching > 0 ? "animate-spin" : ""} />
							</button>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content
								side="right"
								sideOffset={12}
								className="z-50 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-lg"
							>
								{isFetching > 0 ? "Refreshing..." : "Refresh"}
								<Tooltip.Arrow className="fill-border" />
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
				) : (
					<button
						onClick={() => queryClient.invalidateQueries()}
						disabled={isFetching > 0}
						className="flex w-full cursor-pointer items-center gap-3 p-2 text-muted-foreground disabled:cursor-default"
					>
						<RefreshCw size={18} className={isFetching > 0 ? "animate-spin" : ""} />
						<span className="flex-1 text-left text-sm">
							{isFetching > 0 ? "Refreshing..." : "Refresh"}
						</span>
					</button>
				)}
				<hr className="border-border -mx-3" />
				{collapsed ? (
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<button
								onClick={() => setTheme(isDark ? "light" : "dark")}
								className="flex w-full cursor-pointer items-center justify-center p-2"
							>
								{mounted ? (
									isDark ? (
										<Moon size={18} className="text-yellow-400" />
									) : (
										<Sun size={18} className="text-amber-500" />
									)
								) : (
									<span className="h-4.5 w-4.5" />
								)}
							</button>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content
								side="right"
								sideOffset={12}
								className="z-50 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-lg"
							>
								{mounted ? (isDark ? "Dark Mode" : "Light Mode") : "Theme"}
								<Tooltip.Arrow className="fill-border" />
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
				) : (
					<button
						onClick={() => setTheme(isDark ? "light" : "dark")}
						className="flex w-full cursor-pointer items-center gap-3 p-2"
					>
						{mounted ? (
							isDark ? (
								<Moon size={18} className="text-yellow-400" />
							) : (
								<Sun size={18} className="text-amber-500" />
							)
						) : (
							<span className="h-4.5 w-4.5" />
						)}
						<span className="flex-1 text-left text-sm text-muted-foreground">
							{mounted ? (isDark ? "Dark Mode" : "Light Mode") : "\u00A0"}
						</span>
						<span
							className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
								mounted && isDark ? "bg-primary" : "bg-muted-foreground/30"
							}`}
						>
							<span
								className={`block h-4 w-4 rounded-full bg-white transition-transform ${
									mounted && isDark ? "translate-x-4" : "translate-x-0"
								}`}
							/>
						</span>
					</button>
				)}
			</section>

			{/* Zone 4: User info with dropdown */}
			{session?.user && (
				<footer className="border-t border-border p-3">
					<span
						className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
					>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger asChild>
								{collapsed ? (
									<button
										className="cursor-pointer"
									>
										{userPhoto ? (
											<img
												src={userPhoto}
												alt=""
												className="h-8 w-8 rounded-full object-cover"
											/>
										) : (
											<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
												{userInitials}
											</span>
										)}
									</button>
								) : (
									<button className="flex w-full cursor-pointer items-center gap-3 text-left">
										{userPhoto ? (
											<img
												src={userPhoto}
												alt=""
												className="h-8 w-8 shrink-0 rounded-full object-cover"
											/>
										) : (
											<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
												{userInitials}
											</span>
										)}
										<span className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{session.user.name}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{session.user.email}
											</p>
										</span>
										<MoreVertical
											size={16}
											className="shrink-0 text-muted-foreground"
										/>
									</button>
								)}
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									align="center"
									side="top"
									sideOffset={8}
									className="z-50 min-w-55 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
								>
									{/* User info header */}
									<header className="flex items-center gap-3 border-b border-border bg-muted/50 px-3 py-3">
										{userPhoto ? (
											<img
												src={userPhoto}
												alt=""
												className="h-10 w-10 shrink-0 rounded-full object-cover"
											/>
										) : (
											<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
												{userInitials}
											</span>
										)}
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
											onClick={() => signOut({ callbackUrl: "/login" })}
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
		</Tooltip.Provider>
	);
}
