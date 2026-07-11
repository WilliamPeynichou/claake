"use client";

import {
	Activity,
	BarChart3,
	Bot,
	Flag,
	LayoutDashboard,
	ShieldCheck,
	Unplug,
	UserCog,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

const adminLinks = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/admin/agents", label: "Agents", icon: Bot },
	{ href: "/admin/review", label: "File de revue", icon: ShieldCheck },
	{ href: "/admin/mcp", label: "Revue MCP", icon: Unplug },
	{ href: "/admin/users", label: "Utilisateurs", icon: Users },
	{ href: "/admin/stats", label: "Statistiques", icon: BarChart3 },
	{ href: "/admin/activity", label: "Activité", icon: Activity },
];

const superAdminLinks = [
	{ href: "/admin/manage-admins", label: "Gérer les admins", icon: UserCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { role, loading } = useAuth();
	const pathname = usePathname();

	const isSuperAdmin = role === "super_admin" || role === "SUPER_ADMIN";
	const isAdmin = isSuperAdmin || role === "admin" || role === "ADMIN";
	const allLinks = isSuperAdmin ? [...adminLinks, ...superAdminLinks] : adminLinks;

	if (loading) {
		return (
			<div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
				<p className="text-muted-foreground">Chargement...</p>
			</div>
		);
	}

	if (!isAdmin) {
		return (
			<div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
				<Flag className="h-10 w-10 text-muted-foreground/30" />
				<h3 className="mt-4 text-lg font-semibold">Accès refusé</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Cet espace est réservé aux administrateurs.
				</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-[calc(100vh-8rem)]">
			<aside className="w-64 border-r bg-muted/40 p-6">
				<div className="mb-4 flex items-center gap-2">
					<Flag className="h-4 w-4 text-destructive" />
					<p className="text-xs font-semibold uppercase text-muted-foreground">
						{isSuperAdmin ? "Super Administration" : "Administration"}
					</p>
				</div>
				<nav className="flex flex-col gap-1">
					{allLinks.map((link) => {
						const isActive = pathname === link.href;
						return (
							<Link
								key={link.href}
								href={link.href}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
									isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent"
								}`}
							>
								<link.icon className="h-4 w-4" />
								{link.label}
							</Link>
						);
					})}
				</nav>
			</aside>
			<main className="flex-1 p-6">{children}</main>
		</div>
	);
}
