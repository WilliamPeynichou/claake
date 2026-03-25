"use client";

import type { Agent } from "@claake/shared";
import { Bot, Check, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function AdminReviewPage() {
	const { token } = useAuth();
	const [agents, setAgents] = useState<Agent[]>([]);
	const [loading, setLoading] = useState(true);
	const [reviewingId, setReviewingId] = useState<string | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [actionLoading, setActionLoading] = useState(false);

	useEffect(() => {
		loadPending();
	}, []);

	async function loadPending() {
		try {
			const result = await apiClient.agents.list({ all: true });
			setAgents(result.agents.filter((a) => a.status === "pending"));
		} catch {
			// Silently fail
		} finally {
			setLoading(false);
		}
	}

	async function handleApprove(agentId: string) {
		if (!token) return;
		setActionLoading(true);
		try {
			await apiClient.agents.review(agentId, "approve", token);
			setAgents((prev) => prev.filter((a) => a.id !== agentId));
		} catch {
			// Silently fail
		} finally {
			setActionLoading(false);
		}
	}

	async function handleReject(agentId: string) {
		if (!token) return;
		setActionLoading(true);
		try {
			await apiClient.agents.review(agentId, "reject", token, rejectReason || undefined);
			setAgents((prev) => prev.filter((a) => a.id !== agentId));
			setReviewingId(null);
			setRejectReason("");
		} catch {
			// Silently fail
		} finally {
			setActionLoading(false);
		}
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">File de revue</h1>
			<p className="mt-2 text-muted-foreground">Agents en attente de validation manuelle.</p>

			{loading ? (
				<div className="mt-8 flex justify-center py-16">
					<p className="text-muted-foreground">Chargement...</p>
				</div>
			) : agents.length === 0 ? (
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
			) : (
				<div className="mt-8 space-y-4">
					{agents.map((agent) => (
						<Card key={agent.id}>
							<CardContent className="p-6">
								<div className="flex items-start justify-between">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<Bot className="h-5 w-5 text-muted-foreground" />
											<h3 className="font-semibold">{agent.name}</h3>
											<Badge variant="outline">En attente</Badge>
										</div>
										<p className="mt-1 text-sm text-muted-foreground">{agent.description}</p>
										<div className="mt-2 flex flex-wrap gap-2">
											<Badge variant="secondary">{agent.category}</Badge>
											<span className="text-xs text-muted-foreground">
												par {agent.creator_name ?? "Inconnu"}
											</span>
											<span className="text-xs text-muted-foreground">
												· {new Date(agent.created_at).toLocaleDateString("fr-FR")}
											</span>
										</div>
										<div className="mt-2 flex flex-wrap gap-1">
											{agent.tags.map((tag) => (
												<Badge key={tag} variant="outline" className="text-xs">
													{tag}
												</Badge>
											))}
										</div>
										<p className="mt-2 text-xs text-muted-foreground">
											Modèle : <span className="font-mono">{agent.models[0]}</span>
											{" · "}Mode : {agent.mode}
										</p>
									</div>
									<div className="ml-4 flex shrink-0 gap-2">
										<Button
											size="sm"
											onClick={() => handleApprove(agent.id)}
											disabled={actionLoading}
										>
											<Check className="mr-1 h-4 w-4" />
											Approuver
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onClick={() => setReviewingId(reviewingId === agent.id ? null : agent.id)}
											disabled={actionLoading}
										>
											<X className="mr-1 h-4 w-4" />
											Rejeter
										</Button>
									</div>
								</div>

								{/* Reject reason form */}
								{reviewingId === agent.id && (
									<div className="mt-4 space-y-2 rounded-md border bg-muted/50 p-3">
										<Textarea
											placeholder="Raison du rejet (optionnel)..."
											value={rejectReason}
											onChange={(e) => setRejectReason(e.target.value)}
											rows={2}
										/>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="destructive"
												onClick={() => handleReject(agent.id)}
												disabled={actionLoading}
											>
												Confirmer le rejet
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => {
													setReviewingId(null);
													setRejectReason("");
												}}
											>
												Annuler
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
