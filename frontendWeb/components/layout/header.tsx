import Link from "next/link";

export function Header() {
	return (
		<header className="border-b">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<Link href="/" className="text-xl font-bold">
					AgentPlace
				</Link>
				<nav className="flex items-center gap-6">
					<Link href="/catalogue" className="text-sm hover:underline">
						Catalogue
					</Link>
					<Link href="/login" className="text-sm hover:underline">
						Connexion
					</Link>
				</nav>
			</div>
		</header>
	);
}
