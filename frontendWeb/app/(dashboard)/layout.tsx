import { Bot, DollarSign, Key, LayoutDashboard, MessageSquare, Plus, Settings } from "lucide-react";
import Link from "next/link";

const sidebarLinks = [
	{ href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
	{ href: "/chat", label: "Chat", icon: MessageSquare },
	{ href: "/dashboard/library", label: "Ma bibliothèque", icon: Bot },
	{ href: "/dashboard/agents/new", label: "Publier un agent", icon: Plus },
	{ href: "/dashboard/agents", label: "Mes agents", icon: Bot },
	{ href: "/dashboard/earnings", label: "Revenus", icon: DollarSign },
	{ href: "/dashboard/api-keys", label: "Clés API", icon: Key },
	{ href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-[calc(100vh-8rem)]">
			<aside className="w-64 border-r bg-muted/40 p-6">
				<p className="mb-4 text-xs font-semibold uppercase text-muted-foreground">
					Espace personnel
				</p>
				<nav className="flex flex-col gap-1">
					{sidebarLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
						>
							<link.icon className="h-4 w-4" />
							{link.label}
						</Link>
					))}
				</nav>
			</aside>
			<main className="flex-1 p-6">{children}</main>
		</div>
	);
}
