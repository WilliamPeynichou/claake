"use client";

import type { Agent, Collection, Favorite } from "@claake/shared";
import { Bot, FolderPlus, Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CollectionDialog } from "@/components/collections/collection-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function LibraryPage() {
	const { token } = useAuth();
	const [favorites, setFavorites] = useState<Favorite[]>([]);
	const [agents, setAgents] = useState<Record<string, Agent>>({});
	const [collections, setCollections] = useState<Collection[]>([]);
	const [showCreateDialog, setShowCreateDialog] = useState(false);

	useEffect(() => {
		if (!token) return;

		apiClient.favorites
			.list(token)
			.then(async (favs) => {
				setFavorites(favs);
				const agentMap: Record<string, Agent> = {};
				await Promise.all(
					favs.map(async (f) => {
						try {
							const agent = await apiClient.agents.get(f.agent_id);
							agentMap[agent.id] = agent;
						} catch {
							// agent may have been deleted
						}
					}),
				);
				setAgents((prev) => ({ ...prev, ...agentMap }));
			})
			.catch(() => {});

		apiClient.collections
			.list(token)
			.then(setCollections)
			.catch(() => {});
	}, [token]);

	async function handleCreateCollection(data: {
		name: string;
		description?: string;
		is_public?: boolean;
	}) {
		if (!token) return;
		try {
			const collection = await apiClient.collections.create(data, token);
			setCollections((prev) => [collection, ...prev]);
			setShowCreateDialog(false);
		} catch {
			// ignore
		}
	}

	async function handleDeleteCollection(id: string) {
		if (!token) return;
		try {
			await apiClient.collections.delete(id, token);
			setCollections((prev) => prev.filter((c) => c.id !== id));
		} catch {
			// ignore
		}
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">Ma biblioth&egrave;que</h1>
			<p className="mt-2 text-muted-foreground">
				Vos agents favoris et collections personnalis&eacute;es.
			</p>

			<Tabs defaultValue="favorites" className="mt-8">
				<TabsList>
					<TabsTrigger value="favorites">
						<Heart className="mr-2 h-4 w-4" />
						Favoris ({favorites.length})
					</TabsTrigger>
					<TabsTrigger value="collections">
						<FolderPlus className="mr-2 h-4 w-4" />
						Collections ({collections.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="favorites" className="mt-6">
					{favorites.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-md border py-16 text-center">
							<Heart className="h-8 w-8 text-muted-foreground/30" />
							<p className="mt-2 text-sm text-muted-foreground">
								Aucun favori pour le moment.
							</p>
							<Link href="/catalogue">
								<Button variant="outline" className="mt-4">
									Explorer le catalogue
								</Button>
							</Link>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{favorites.map((fav) => {
								const agent = agents[fav.agent_id];
								if (!agent) return null;
								return (
									<Link key={fav.id} href={`/agents/${agent.id}`}>
										<Card className="h-full transition-all hover:border-primary/40">
											<CardHeader className="pb-3">
												<div className="flex items-start gap-3">
													<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
														<Bot className="h-5 w-5 text-primary" />
													</div>
													<div className="min-w-0 flex-1">
														<CardTitle className="text-sm">{agent.name}</CardTitle>
														<p className="mt-1 text-xs text-muted-foreground">
															{agent.creator_name ?? "Anonyme"}
														</p>
													</div>
													<Badge variant="secondary" className="text-xs">
														{agent.pricing_model === "free"
															? "Gratuit"
															: `${agent.price}\u20AC`}
													</Badge>
												</div>
											</CardHeader>
											<CardContent>
												<p className="line-clamp-2 text-sm text-muted-foreground">
													{agent.description}
												</p>
											</CardContent>
										</Card>
									</Link>
								);
							})}
						</div>
					)}
				</TabsContent>

				<TabsContent value="collections" className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							{collections.length} collection{collections.length > 1 ? "s" : ""}
						</p>
						<Button size="sm" onClick={() => setShowCreateDialog(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Nouvelle collection
						</Button>
					</div>

					{collections.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-md border py-16 text-center">
							<FolderPlus className="h-8 w-8 text-muted-foreground/30" />
							<p className="mt-2 text-sm text-muted-foreground">
								Aucune collection cr&eacute;&eacute;e.
							</p>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{collections.map((col) => (
								<Card key={col.id} className="transition-all hover:border-primary/40">
									<CardHeader>
										<div className="flex items-start justify-between">
											<CardTitle className="text-sm">{col.name}</CardTitle>
											<div className="flex items-center gap-2">
												{col.is_public && (
													<Badge variant="outline" className="text-xs">
														Public
													</Badge>
												)}
												<Button
													variant="ghost"
													size="sm"
													className="h-6 text-xs text-destructive"
													onClick={() => handleDeleteCollection(col.id)}
												>
													Supprimer
												</Button>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											{col.description || "Aucune description"}
										</p>
										<p className="mt-2 text-xs text-muted-foreground">
											{col.agent_ids.length} agent{col.agent_ids.length > 1 ? "s" : ""}
										</p>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			<CollectionDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onSubmit={handleCreateCollection}
			/>
		</div>
	);
}
