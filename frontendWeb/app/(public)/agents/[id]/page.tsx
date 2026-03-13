import { ArrowLeft, Bot, Cloud, Download, HardDrive, Star, Tag, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAgentById } from "@/lib/mock-data";
import { AgentDetailChat } from "./agent-detail-chat";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const agent = getAgentById(id);

	if (!agent) {
		notFound();
	}

	const modeIcon =
		agent.mode === "cloud" ? <Cloud className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />;

	return (
		<div className="container mx-auto px-4 py-8">
			<Link
				href="/catalogue"
				className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				Retour au catalogue
			</Link>

			<div className="grid gap-8 lg:grid-cols-3">
				{/* Agent Info */}
				<div className="lg:col-span-2 space-y-6">
					<div className="flex items-start gap-4">
						<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
							<Bot className="h-8 w-8 text-primary" />
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-3">
								<h1 className="text-3xl font-bold">{agent.name}</h1>
								<Badge variant="secondary">v{agent.version}</Badge>
							</div>
							<div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
								<span className="flex items-center gap-1">
									<User className="h-3.5 w-3.5" />
									{agent.creator_name ?? "Anonyme"}
								</span>
								<span className="flex items-center gap-1">
									<Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
									{agent.average_rating.toFixed(1)} ({agent.reviews_count} avis)
								</span>
								<span className="flex items-center gap-1">
									<Download className="h-3.5 w-3.5" />
									{agent.downloads_count} utilisations
								</span>
							</div>
						</div>
					</div>

					<p className="text-lg text-muted-foreground">{agent.description}</p>

					{agent.long_description && (
						<div className="prose prose-sm max-w-none">
							<p>{agent.long_description}</p>
						</div>
					)}

					<div className="flex flex-wrap gap-2">
						{agent.tags.map((tag) => (
							<Badge key={tag} variant="outline">
								<Tag className="mr-1 h-3 w-3" />
								{tag}
							</Badge>
						))}
					</div>

					<Separator />

					{/* Chat */}
					<AgentDetailChat agent={agent} />
				</div>

				{/* Sidebar */}
				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Informations</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Prix</span>
								<Badge>{agent.price_type === "free" ? "Gratuit" : `${agent.price}€`}</Badge>
							</div>
							<Separator />
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Modèle</span>
								<span className="font-mono text-xs">{agent.model}</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Mode</span>
								<span className="flex items-center gap-1 capitalize">
									{modeIcon}
									{agent.mode}
								</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Catégorie</span>
								<span className="capitalize">{agent.category}</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Version</span>
								<span>{agent.version}</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Mis à jour</span>
								<span>{new Date(agent.updated_at).toLocaleDateString("fr-FR")}</span>
							</div>
						</CardContent>
					</Card>

					<Button className="w-full" size="lg">
						<Download className="mr-2 h-4 w-4" />
						Utiliser cet agent
					</Button>
				</div>
			</div>
		</div>
	);
}
