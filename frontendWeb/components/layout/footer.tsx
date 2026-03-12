export function Footer() {
	return (
		<footer className="border-t py-6">
			<div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
				&copy; {new Date().getFullYear()} AgentPlace. Tous droits r&eacute;serv&eacute;s.
			</div>
		</footer>
	);
}
