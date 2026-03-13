import { Bot, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MyAgentsPage() {
	return (
		<div>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Mes agents</h1>
					<p className="mt-2 text-muted-foreground">
						Gérez les agents que vous avez créés et publiés.
					</p>
				</div>
				<Button asChild>
					<Link href="/dashboard/agents/new">
						<Plus className="mr-2 h-4 w-4" />
						Publier un agent
					</Link>
				</Button>
			</div>

			<div className="mt-8 flex flex-col items-center justify-center rounded-md border py-16 text-center">
				<Bot className="h-12 w-12 text-muted-foreground/30" />
				<h3 className="mt-4 text-lg font-semibold">Aucun agent publié</h3>
				<p className="mt-2 max-w-sm text-sm text-muted-foreground">
					Vous n&apos;avez pas encore publié d&apos;agents. Créez votre premier agent IA et
					partagez-le avec la communauté.
				</p>
				<Button className="mt-6" asChild>
					<Link href="/dashboard/agents/new">
						<Plus className="mr-2 h-4 w-4" />
						Créer mon premier agent
					</Link>
				</Button>
			</div>
		</div>
	);
}
