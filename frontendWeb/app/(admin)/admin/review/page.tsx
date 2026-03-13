import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReviewPage() {
	return (
		<div>
			<h1 className="text-3xl font-bold">File de revue</h1>
			<p className="mt-2 text-muted-foreground">Agents en attente de validation manuelle.</p>

			<Card className="mt-8">
				<CardHeader>
					<CardTitle className="text-lg">En attente de revue</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<ShieldCheck className="h-12 w-12 text-muted-foreground/30" />
						<h3 className="mt-4 text-lg font-semibold">Aucun agent en attente</h3>
						<p className="mt-2 max-w-sm text-sm text-muted-foreground">
							Tous les agents soumis ont été validés ou rejetés. La file de revue est vide.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
