import { ArrowRight, Bot } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LibraryPage() {
	return (
		<div>
			<h1 className="text-3xl font-bold">Ma bibliothèque</h1>
			<p className="mt-2 text-muted-foreground">
				Retrouvez ici tous les agents que vous avez ajoutés à votre bibliothèque.
			</p>

			<div className="mt-8 flex flex-col items-center justify-center rounded-md border py-16 text-center">
				<Bot className="h-12 w-12 text-muted-foreground/30" />
				<h3 className="mt-4 text-lg font-semibold">Bibliothèque vide</h3>
				<p className="mt-2 max-w-sm text-sm text-muted-foreground">
					Vous n&apos;avez pas encore ajouté d&apos;agents. Explorez le catalogue pour découvrir des
					agents IA.
				</p>
				<Button className="mt-6" asChild>
					<Link href="/catalogue">
						Explorer le catalogue
						<ArrowRight className="ml-2 h-4 w-4" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
