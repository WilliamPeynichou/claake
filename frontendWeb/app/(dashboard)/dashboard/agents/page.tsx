"use client";

import type { Agent } from "@claake/shared";
import { Bot, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

const statusLabels: Record<
	string,
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
	draft: { label: "Brouillon", variant: "secondary" },
	pending: { label: "En attente", variant: "outline" },
	approved: { label: "Publié", variant: "default" },
	rejected: { label: "Rejeté", variant: "destructive" },
	suspended: { label: "Suspendu", variant: "destructive" },
};

export default function MyAgentsPage() {
	const { token } = useAuth();
	const [agents, setAgents] = useState<Agent[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<Agent | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token) return;
		apiClient.agents
			.mine(token)
			.then((res) => setAgents(res.agents))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [token]);

	async function handleUnpublish(agent: Agent) {
		if (!token) return;
		setActionLoading(agent.id);
		setError(null);
		try {
			await apiClient.agents.unpublish(agent.id, token);
			setAgents((prev) =>
				prev.map((a) => (a.id === agent.id ? { ...a, status: "draft" } : a)),
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la dépublication.");
		} finally {
			setActionLoading(null);
		}
	}

	async function handleDelete(agent: Agent) {
		if (!token) return;
		setActionLoading(agent.id);
		setError(null);
		setConfirmDelete(null);
		try {
			await apiClient.agents.delete(agent.id, token);
			setAgents((prev) => prev.filter((a) => a.id !== agent.id));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
		} finally {
			setActionLoading(null);
		}
	}

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

			{error && (
				<div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{loading ? (
				<div className="mt-8 flex justify-center py-16">
					<p className="text-muted-foreground">Chargement...</p>
				</div>
			) : agents.length === 0 ? (
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
			) : (
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{agents.map((agent) => {
						const status = statusLabels[agent.status] ?? statusLabels.draft;
						const isLoading = actionLoading === agent.id;
						return (
							<Card key={agent.id}>
								<CardContent className="p-4">
									<div className="flex items-start justify-between">
										<div className="min-w-0 flex-1">
											<h3 className="truncate font-semibold">{agent.name}</h3>
											<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
												{agent.description}
											</p>
										</div>
										<Badge variant={status.variant} className="ml-2 shrink-0">
											{status.label}
										</Badge>
									</div>
									<div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
										<span className="font-mono">{agent.models[0]}</span>
										<span>{new Date(agent.created_at).toLocaleDateString("fr-FR")}</span>
									</div>
									<div className="mt-3 flex gap-2">
										<Button variant="outline" size="sm" asChild className="flex-1">
											<Link href={`/agents/${agent.id}`}>
												<Eye className="mr-1 h-3.5 w-3.5" />
												Voir
											</Link>
										</Button>
										{(agent.status === "draft" || agent.status === "rejected") && (
											<Button variant="outline" size="sm" asChild className="flex-1">
												<Link href={`/dashboard/agents/${agent.id}/edit`}>
													<Pencil className="mr-1 h-3.5 w-3.5" />
													Modifier
												</Link>
											</Button>
										)}
										{agent.status === "approved" && (
											<Button
												variant="outline"
												size="sm"
												className="flex-1"
												disabled={isLoading}
												onClick={() => handleUnpublish(agent)}
											>
												{isLoading ? "..." : "Dépublier"}
											</Button>
										)}
										<Button variant="outline" size="sm" asChild className="flex-1">
											<Link href={`/chat/${agent.id}`}>Chat</Link>
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="text-destructive hover:text-destructive"
											disabled={isLoading || agent.status === "approved"}
											title={
												agent.status === "approved"
													? "Dépubliez l'agent avant de le supprimer"
													: "Supprimer"
											}
											onClick={() => setConfirmDelete(agent)}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			<Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Supprimer l&apos;agent</DialogTitle>
						<DialogDescription>
							Êtes-vous sûr de vouloir supprimer{" "}
							<span className="font-semibold">{confirmDelete?.name}</span> ? Cette action est
							irréversible.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmDelete(null)}>
							Annuler
						</Button>
						<Button
							variant="destructive"
							onClick={() => confirmDelete && handleDelete(confirmDelete)}
						>
							Supprimer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
