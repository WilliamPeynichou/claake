import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-[calc(100vh-8rem)]">
			<aside className="w-64 border-r bg-muted/40 p-6">
				<nav className="flex flex-col gap-2">
					<Link href="/dashboard" className="text-sm font-medium hover:underline">
						Tableau de bord
					</Link>
					<Link href="/dashboard/agents/new" className="text-sm font-medium hover:underline">
						Publier un agent
					</Link>
				</nav>
			</aside>
			<main className="flex-1 p-6">{children}</main>
		</div>
	);
}
