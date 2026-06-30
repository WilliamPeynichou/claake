import { XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
	return (
		<div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
			<XCircle className="h-16 w-16 text-muted-foreground" />
			<h1 className="mt-6 text-3xl font-bold">Achat annul&eacute;</h1>
			<p className="mt-2 max-w-md text-muted-foreground">
				L&apos;achat a &eacute;t&eacute; annul&eacute;. Aucun montant n&apos;a &eacute;t&eacute;
				d&eacute;bit&eacute;.
			</p>
			<div className="mt-8 flex gap-4">
				<Button asChild>
					<Link href="/catalogue">Retour au catalogue</Link>
				</Button>
			</div>
		</div>
	);
}
