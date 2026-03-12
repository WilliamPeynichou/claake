import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
	return (
		<div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
			<h1 className="text-5xl font-bold tracking-tight">La marketplace d&apos;agents IA</h1>
			<p className="mt-6 max-w-2xl text-lg text-muted-foreground">
				D&eacute;couvrez, testez et d&eacute;ployez des agents IA cr&eacute;&eacute;s par la
				communaut&eacute;.
			</p>
			<div className="mt-10 flex gap-4">
				<Button asChild>
					<Link href="/catalogue">Explorer le catalogue</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/register">Cr&eacute;er un compte</Link>
				</Button>
			</div>
		</div>
	);
}
