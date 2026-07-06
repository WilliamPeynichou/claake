"use client";

import type { Agent } from "@claake/shared";
import { Bot, Check, ClipboardCheck, RotateCcw, ShieldCheck, TestTube2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

type ReviewDecision = "approve" | "reject" | "back_to_draft";

const statusLabel: Record<Agent["status"], string> = {
	approved: "Publié",
	draft: "Brouillon",
	pending: "En attente",
	rejected: "Rejeté",
	suspended: "Suspendu",
};

const strategyLabel: Record<string, string> = {
	user_api_key: "Clé API utilisateur",
	seller_api_key: "Clé API créateur",
	seller_endpoint: "Endpoint vendeur",
};

export function AdminReviewPage() {
	const { token } = useAuth();
	const [agents, setAgents] = useState<Agent[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeDecision, setActiveDecision] = useState<{
		agentId: string;
		decision: Exclude<ReviewDecision, "approve">;
	} | null>(null);
	const [reason, setReason] = useState("");
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const pendingAgents = useMemo(
		() => agents.filter((agent) => agent.status === "pending"),
		[agents],
	);

	const loadPending = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		setError(null);
		try {
			const result = await apiClient.agents.list({ all: true, sort_by: "newest" }, token);
			setAgents(result.agents.filter((agent) => agent.status === "pending"));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Impossible de charger la file de revue.");
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		void loadPending();
	}, [loadPending]);

	async function reviewAgent(agentId: string, decision: ReviewDecision) {
		if (!token) return;
		setActionLoading(`${agentId}:${decision}`);
		setError(null);
		try {
			await apiClient.agents.review(agentId, decision, token, reason.trim() || undefined);
			setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
			setActiveDecision(null);
			setReason("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Action de revue impossible.");
		} finally {
			setActionLoading(null);
		}
	}

	return (
		<div>
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold">File de revue</h1>
					<p className="mt-2 text-muted-foreground">
						Agents soumis à validation manuelle avant publication.
					</p>
				</div>
				<Badge variant="secondary" className="mt-1">
					{pendingAgents.length} en attente
				</Badge>
			</div>

			{error && (
				<Card className="mt-6 border-destructive/40 bg-destructive/5">
					<CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
				</Card>
			)}

			{loading ? (
				<div className="mt-8 flex justify-center py-16">
					<p className="text-muted-foreground">Chargement...</p>
				</div>
			) : pendingAgents.length === 0 ? (
				<EmptyReviewQueue />
			) : (
				<div className="mt-8 space-y-4">
					{pendingAgents.map((agent) => (
						<ReviewAgentCard
							key={agent.id}
							agent={agent}
							activeDecision={activeDecision}
							reason={reason}
							actionLoading={actionLoading}
							onReasonChange={setReason}
							onStartDecision={(decision) => {
								setActiveDecision({ agentId: agent.id, decision });
								setReason("");
							}}
							onCancelDecision={() => {
								setActiveDecision(null);
								setReason("");
							}}
							onReview={reviewAgent}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function EmptyReviewQueue() {
	return (
		<Card className="mt-8">
			<CardHeader>
				<CardTitle className="text-lg">En attente de revue</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<ShieldCheck className="h-12 w-12 text-muted-foreground/30" />
					<h3 className="mt-4 text-lg font-semibold">Aucun agent en attente</h3>
					<p className="mt-2 max-w-sm text-sm text-muted-foreground">
						Tous les agents soumis ont été validés, rejetés ou remis en brouillon.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function ReviewAgentCard({
	agent,
	activeDecision,
	reason,
	actionLoading,
	onReasonChange,
	onStartDecision,
	onCancelDecision,
	onReview,
}: {
	agent: Agent;
	activeDecision: { agentId: string; decision: Exclude<ReviewDecision, "approve"> } | null;
	reason: string;
	actionLoading: string | null;
	onReasonChange: (value: string) => void;
	onStartDecision: (decision: Exclude<ReviewDecision, "approve">) => void;
	onCancelDecision: () => void;
	onReview: (agentId: string, decision: ReviewDecision) => Promise<void>;
}) {
	const isRejecting = activeDecision?.agentId === agent.id && activeDecision.decision === "reject";
	const isBackToDraft =
		activeDecision?.agentId === agent.id && activeDecision.decision === "back_to_draft";
	const isLoading = actionLoading?.startsWith(`${agent.id}:`) ?? false;

	return (
		<Card>
			<CardContent className="space-y-5 p-6">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<Bot className="h-5 w-5 text-muted-foreground" />
							<h3 className="font-semibold">{agent.name}</h3>
							<Badge variant="outline">{statusLabel[agent.status]}</Badge>
							<Badge variant="secondary">{agent.category}</Badge>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">{agent.description}</p>
						<div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
							<span>Créateur : {agent.creator_name ?? "Inconnu"}</span>
							<span>· Soumis le {new Date(agent.updated_at).toLocaleDateString("fr-FR")}</span>
							<span>· Créé le {new Date(agent.created_at).toLocaleDateString("fr-FR")}</span>
						</div>
					</div>

					<div className="flex shrink-0 flex-wrap gap-2">
						<Button asChild size="sm" variant="outline">
							<Link href={`/chat/${agent.id}?test=1`}>
								<TestTube2 className="mr-1 h-4 w-4" />
								Tester dans le chat
							</Link>
						</Button>
						<Button size="sm" onClick={() => onReview(agent.id, "approve")} disabled={isLoading}>
							<Check className="mr-1 h-4 w-4" />
							Approuver
						</Button>
						<Button
							size="sm"
							variant="secondary"
							onClick={() => onStartDecision("back_to_draft")}
							disabled={isLoading}
						>
							<RotateCcw className="mr-1 h-4 w-4" />
							Brouillon
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={() => onStartDecision("reject")}
							disabled={isLoading}
						>
							<X className="mr-1 h-4 w-4" />
							Rejeter
						</Button>
					</div>
				</div>

				<AgentReviewDetails agent={agent} />

				{(isRejecting || isBackToDraft) && (
					<div className="space-y-3 rounded-md border bg-muted/50 p-3">
						<div className="flex items-center gap-2 text-sm font-medium">
							<ClipboardCheck className="h-4 w-4" />
							{isRejecting
								? "Raison du rejet"
								: "Modifications attendues avant nouvelle soumission"}
						</div>
						<Textarea
							placeholder="Explique clairement ce que le créateur doit corriger..."
							value={reason}
							onChange={(event) => onReasonChange(event.target.value)}
							rows={3}
						/>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant={isRejecting ? "destructive" : "default"}
								onClick={() => onReview(agent.id, isRejecting ? "reject" : "back_to_draft")}
								disabled={isLoading}
							>
								Confirmer
							</Button>
							<Button size="sm" variant="ghost" onClick={onCancelDecision} disabled={isLoading}>
								Annuler
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function AgentReviewDetails({ agent }: { agent: Agent }) {
	const capabilities = agent.capabilities as { files?: boolean; images?: boolean } | null;
	return (
		<div className="grid gap-4 rounded-lg border bg-muted/20 p-4 text-sm lg:grid-cols-2">
			<DetailBlock label="Prompt système" value={agent.system_prompt || "Non renseigné"} pre />
			<DetailBlock
				label="Description longue"
				value={agent.long_description || "Non renseignée"}
				pre
			/>
			<DetailBlock
				label="Provider requis"
				value={agent.required_user_provider || "Selon stratégie"}
			/>
			<DetailBlock label="Modèles" value={agent.models.join(", ") || "Aucun"} />
			<DetailBlock label="Mode" value={agent.mode} />
			<DetailBlock
				label="Stratégie d'exécution"
				value={
					agent.cloud_strategy
						? (strategyLabel[agent.cloud_strategy] ?? agent.cloud_strategy)
						: "Non renseignée"
				}
			/>
			<DetailBlock label="Message d'accueil" value={agent.welcome_message || "Non renseigné"} pre />
			<DetailBlock
				label="Suggestions"
				value={agent.suggested_prompts.length ? agent.suggested_prompts.join("\n") : "Aucune"}
				pre
			/>
			<DetailBlock
				label="Limitations"
				value={agent.limitations.length ? agent.limitations.join("\n") : "Aucune"}
				pre
			/>
			<DetailBlock
				label="Capacités"
				value={`Fichiers : ${capabilities?.files ? "oui" : "non"} · Images : ${
					capabilities?.images ? "oui" : "non"
				}`}
			/>
		</div>
	);
}

function DetailBlock({
	label,
	value,
	pre = false,
}: {
	label: string;
	value: string;
	pre?: boolean;
}) {
	return (
		<div>
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
			<p className={pre ? "mt-1 whitespace-pre-wrap text-sm" : "mt-1 text-sm"}>{value}</p>
		</div>
	);
}
