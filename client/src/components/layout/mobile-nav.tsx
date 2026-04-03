"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Archive, Users, Trash2 } from "lucide-react";

const navItems = [
	{ href: "/notes", icon: FileText, label: "Notes" },
	{ href: "/archived", icon: Archive, label: "Archived" },
	{ href: "/shared", icon: Users, label: "Shared" },
	{ href: "/trash", icon: Trash2, label: "Trash" },
];

export function MobileNav() {
	const pathname = usePathname();

	return (
		<nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
			<ul className="flex items-center justify-around">
				{navItems.map(({ href, icon: Icon, label }) => {
					const isActive = pathname.startsWith(href);

					return (
						<li key={href}>
							<Link
								href={href}
								aria-current={isActive ? "page" : undefined}
								className={`relative flex flex-col items-center gap-0.5 px-4 py-2 ${
									isActive
										? "text-primary"
										: "text-muted-foreground"
								}`}
							>
								{isActive && (
									<span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b bg-primary" />
								)}
								<Icon size={22} />
								<span className="text-[10px] font-semibold">{label}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
