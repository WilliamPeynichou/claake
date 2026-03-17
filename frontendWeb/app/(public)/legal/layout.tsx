import Link from "next/link";

const legalLinks = [
	{ href: "/legal/mentions-legales", label: "Mentions légales" },
	{ href: "/legal/cgu", label: "CGU" },
	{ href: "/legal/cgv", label: "CGV" },
	{ href: "/legal/confidentialite", label: "Confidentialité" },
	{ href: "/legal/conditions-developpeur", label: "Conditions développeur" },
	{ href: "/legal/cookies", label: "Politique cookies" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="container mx-auto px-4 py-12">
			<div className="max-w-3xl mx-auto">
				<nav className="flex flex-wrap gap-x-6 gap-y-2 mb-10 pb-6 border-b border-border/40 text-sm">
					{legalLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							{link.label}
						</Link>
					))}
				</nav>
				{children}
			</div>
		</div>
	);
}
