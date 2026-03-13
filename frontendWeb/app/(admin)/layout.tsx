import { Bot, Flag, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

const adminLinks = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/admin/agents", label: "Agents", icon: Bot },
	{ href: "/admin/review", label: "File de revue", icon: ShieldCheck },
	{ href: "/admin/users", label: "Utilisateurs", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-[calc(100vh-8rem)]">
			<aside className="w-64 border-r bg-muted/40 p-6">
				<div className="mb-4 flex items-center gap-2">
					<Flag className="h-4 w-4 text-destructive" />
					<p className="text-xs font-semibold uppercase text-muted-foreground">Administration</p>
				</div>
				<nav className="flex flex-col gap-1">
					{adminLinks.map((link) => (
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
