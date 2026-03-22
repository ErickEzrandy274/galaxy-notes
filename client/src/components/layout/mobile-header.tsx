"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Bell,
	User,
	LogOut,
	RefreshCw,
	Moon,
	Sun,
	MoreVertical,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useUnreadNotificationCount } from "@/features/notes/hooks/use-notifications";
import { Avatar } from "@/components/primitives/avatar";
import { getInitials } from "@/lib/get-initials";

function RefreshMenuItem() {
	const queryClient = useQueryClient();
	const isFetching = useIsFetching();

	return (
		<DropdownMenu.Item
			onSelect={() => queryClient.invalidateQueries()}
			disabled={isFetching > 0}
			className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-muted disabled:cursor-default disabled:opacity-50"
		>
			<RefreshCw
				size={16}
				className={isFetching > 0 ? "animate-spin" : ""}
			/>
			{isFetching > 0 ? "Refreshing..." : "Refresh"}
		</DropdownMenu.Item>
	);
}

export function MobileHeader() {
	const pathname = usePathname();
	const { data: session } = useSession();
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();
	const { data: profile } = useProfile();
	const { data: unreadData } = useUnreadNotificationCount();

	useEffect(() => setMounted(true), []);

	const isDark = theme === "dark";
	const userPhoto = profile?.photo ?? null;
	const userInitials = getInitials(session?.user?.name);
	const notificationCount = unreadData?.count ?? 0;
	const isNotificationsPage = pathname.startsWith("/notifications");

	return (
		<header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
			{/* Logo */}
			<Link
				href="/notes"
				className="flex items-center gap-2 text-xl font-bold"
			>
				<span className="text-yellow-400">✦</span>
				<span className="text-foreground">Galaxy</span>
				<span className="text-purple-700">Notes</span>
			</Link>

			{/* Right: Bell + Avatar + More */}
			<div className="flex items-center gap-3">
				{/* Bell icon */}
				<Link
					href="/notifications"
					aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
					className={`relative p-1 ${
						isNotificationsPage
							? "text-primary"
							: "text-muted-foreground"
					}`}
				>
					<Bell size={20} />
					{notificationCount > 0 && (
						<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
							{notificationCount > 9 ? "9+" : notificationCount}
						</span>
					)}
				</Link>

				{/* Dropdown menu */}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild>
						<button className="flex cursor-pointer items-center gap-2" aria-label="User menu">
							<Avatar
								src={userPhoto}
								initials={userInitials}
								size="md"
							/>
							<MoreVertical
								size={16}
								className="text-muted-foreground"
							/>
						</button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							align="end"
							sideOffset={8}
							className="z-50 min-w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
						>
							{/* User info header */}
							{session?.user && (
								<header className="flex items-center gap-3 border-b border-border bg-muted/50 px-3 py-3">
									<Avatar
										src={userPhoto}
										initials={userInitials}
										size="lg"
									/>
									<span className="min-w-0">
										<p className="truncate text-sm font-semibold text-foreground">
											{session.user.name}
										</p>
										<p className="truncate text-xs text-muted-foreground">
											{session.user.email}
										</p>
									</span>
								</header>
							)}
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
								<RefreshMenuItem />
								<DropdownMenu.Item
									onSelect={() => setTheme(isDark ? "light" : "dark")}
									className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-muted"
								>
									{mounted ? (
										isDark ? (
											<Moon size={16} className="text-yellow-400" />
										) : (
											<Sun size={16} className="text-amber-500" />
										)
									) : (
										<span className="h-4 w-4" />
									)}
									<span className="flex-1">
										{mounted ? (isDark ? "Dark Mode" : "Light Mode") : "Theme"}
									</span>
									<span
										className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
											mounted && isDark
												? "bg-primary"
												: "bg-muted-foreground/30"
										}`}
									>
										<span
											className={`block h-4 w-4 rounded-full bg-white transition-transform ${
												mounted && isDark
													? "translate-x-4"
													: "translate-x-0"
											}`}
										/>
									</span>
								</DropdownMenu.Item>
								<DropdownMenu.Separator className="mx-1 my-1 h-px bg-border" />
								<DropdownMenu.Item
									onSelect={() => signOut({ callbackUrl: "/login" })}
									className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive outline-none hover:bg-muted"
								>
									<LogOut size={16} />
									Log out
								</DropdownMenu.Item>
							</menu>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			</div>
		</header>
	);
}
