import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
	return (
		<div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
			<CheckCircle className="h-16 w-16 text-green-500" />
			<h1 className="mt-6 text-3xl font-bold">Achat confirm&eacute; !</h1>
			<p className="mt-2 max-w-md text-muted-foreground">
				Votre achat a &eacute;t&eacute; trait&eacute; avec succ&egrave;s. Vous pouvez d&eacute;sormais
				utiliser cet agent.
			</p>
			<div className="mt-8 flex gap-4">
				<Button asChild>
					<Link href="/dashboard/library">Ma biblioth&egrave;que</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/catalogue">Continuer &agrave; explorer</Link>
				</Button>
			</div>
		</div>
	);
}
