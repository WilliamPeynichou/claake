import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-[calc(100vh-8rem)]">
			<aside className="w-64 border-r bg-muted/40 p-6">
				<p className="mb-4 text-xs font-semibold uppercase text-muted-foreground">Administration</p>
				<nav className="flex flex-col gap-2">
					<Link href="/admin" className="text-sm font-medium hover:underline">
						Dashboard
					</Link>
					<Link href="/admin/agents" className="text-sm font-medium hover:underline">
						Agents
					</Link>
					<Link href="/admin/users" className="text-sm font-medium hover:underline">
						Utilisateurs
					</Link>
				</nav>
			</aside>
			<main className="flex-1 p-6">{children}</main>
		</div>
	);
}
