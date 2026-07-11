"use client";

import type { McpReviewDecision, McpReviewItem } from "@claake/shared";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function AdminMcpPage() {
	const { token } = useAuth();
	const [items, setItems] = useState<McpReviewItem[]>([]);
	const [reason, setReason] = useState<Record<string, string>>({});
	const [error, setError] = useState<string | null>(null);
	const load = useCallback(async () => {
		if (!token) return;
		try {
			setItems(await apiClient.admin.mcp.list(token));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Chargement impossible.");
		}
	}, [token]);
	useEffect(() => void load(), [load]);
	async function review(id: string, decision: McpReviewDecision) {
		if (!token) return;
		try {
			await apiClient.admin.mcp.review(id, decision, token, reason[id]);
			await load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Revue impossible.");
		}
	}
	return (
		<div>
			<h1 className="text-3xl font-bold">Revue MCP</h1>
			<p className="mt-2 text-muted-foreground">Serveurs et outils soumis par les créateurs.</p>
			{error && <p className="mt-4 text-sm text-destructive">{error}</p>}
			<div className="mt-6 space-y-4">
				{items.length === 0 && <p className="text-muted-foreground">Aucun serveur en attente.</p>}
				{items.map((item) => (
					<Card key={item.id}>
						<CardContent className="space-y-4 p-5">
							<div className="flex justify-between gap-3">
								<div>
									<h2 className="font-semibold">{item.name}</h2>
									<p className="break-all text-sm text-muted-foreground">{item.url}</p>
								</div>
								<Badge variant="outline">{item.review_status}</Badge>
							</div>
							<div className="flex flex-wrap gap-2">
								{item.tools
									.filter((tool) => tool.selected)
									.map((tool) => (
										<Badge key={tool.id} variant="secondary">
											{tool.name}
										</Badge>
									))}
							</div>
							<Input
								placeholder="Motif (rejet/suspension)"
								value={reason[item.id] ?? ""}
								onChange={(e) =>
									setReason((current) => ({ ...current, [item.id]: e.target.value }))
								}
							/>
							<div className="flex gap-2">
								<Button size="sm" onClick={() => void review(item.id, "approve")}>
									Approuver
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={() => void review(item.id, "reject")}
								>
									Rejeter
								</Button>
								<Button size="sm" variant="outline" onClick={() => void review(item.id, "suspend")}>
									Suspendre
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
