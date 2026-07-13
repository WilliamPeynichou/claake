import type { CreatorProfile } from "@claake/shared";
import { ApiError, createApiClient } from "@claake/shared";
import { ArrowLeft, Bot, ExternalLink, Github, Globe, Linkedin, Star, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentCard } from "@/components/agents/agent-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set");
const serverApiClient = createApiClient(API_URL);

function getLinkIcon(label: string) {
	const lower = label.toLowerCase();
	if (lower.includes("github")) return Github;
	if (lower.includes("linkedin")) return Linkedin;
	if (lower.includes("site") || lower.includes("web") || lower.includes("portfolio")) return Globe;
	return ExternalLink;
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	let creator: CreatorProfile;
	try {
		creator = await serverApiClient.creators.get(id);
	} catch (e) {
		if (e instanceof ApiError && e.status === 404) {
			notFound();
		}
		throw e;
	}

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
				{/* Profile info */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-center gap-4">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
									<User className="h-8 w-8 text-primary" />
								</div>
								<div>
									<CardTitle>{creator.display_name ?? "Cr\u00e9ateur"}</CardTitle>
									<p className="text-sm text-muted-foreground">Cr\u00e9ateur sur Claake</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{creator.bio && <p className="text-sm text-muted-foreground">{creator.bio}</p>}

							<Separator />

							<div className="grid grid-cols-3 gap-4 text-center">
								<div>
									<p className="text-2xl font-bold">{creator.stats.total_agents}</p>
									<p className="text-xs text-muted-foreground">Agents</p>
								</div>
								<div>
									<p className="text-2xl font-bold">{creator.stats.total_reviews}</p>
									<p className="text-xs text-muted-foreground">Avis</p>
								</div>
								<div>
									<div className="flex items-center justify-center gap-1">
										<Star className="h-4 w-4 fill-current text-yellow-500" />
										<span className="text-2xl font-bold">
											{creator.stats.average_rating.toFixed(1)}
										</span>
									</div>
									<p className="text-xs text-muted-foreground">Note</p>
								</div>
							</div>

							{creator.portfolio_links.length > 0 && (
								<>
									<Separator />
									<div className="space-y-2">
										<p className="text-sm font-medium">Liens</p>
										{creator.portfolio_links.map((link) => {
											const Icon = getLinkIcon(link.label);
											return (
												<a
													key={link.url}
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
												>
													<Icon className="h-4 w-4" />
													{link.label}
												</a>
											);
										})}
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Published agents */}
				<div className="lg:col-span-2">
					<h2 className="mb-6 text-xl font-semibold">
						Agents publi\u00e9s ({creator.published_agents.length})
					</h2>
					{creator.published_agents.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-md border py-16 text-center">
							<Bot className="h-8 w-8 text-muted-foreground/30" />
							<p className="mt-2 text-sm text-muted-foreground">
								Aucun agent publi\u00e9 pour le moment.
							</p>
						</div>
					) : (
						<div className="grid gap-6 sm:grid-cols-2">
							{creator.published_agents.map((agent) => (
								<AgentCard key={agent.id} agent={agent} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
