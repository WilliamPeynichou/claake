"use client";

import type { Agent } from "@agentplace/shared";
import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";

const statusLabel: Record<string, string> = {
	approved: "Publié",
	pending: "En attente",
	draft: "Brouillon",
	rejected: "Rejeté",
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
	approved: "default",
	pending: "secondary",
	draft: "outline",
	rejected: "destructive",
};

export default function AdminAgentsPage() {
	const [agents, setAgents] = useState<Agent[]>([]);

	useEffect(() => {
		apiClient.agents
			.list({ all: true })
			.then((res) => setAgents(res.agents))
			.catch(() => {});
	}, []);

	return (
		<div>
			<h1 className="text-3xl font-bold">Gestion des agents</h1>
			<p className="mt-2 text-muted-foreground">Gérez tous les agents de la plateforme.</p>

			<Card className="mt-8">
				<CardHeader>
					<CardTitle className="text-lg">Tous les agents ({agents.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left">
									<th className="pb-3 font-medium text-muted-foreground">Nom</th>
									<th className="pb-3 font-medium text-muted-foreground">Créateur</th>
									<th className="pb-3 font-medium text-muted-foreground">Catégorie</th>
									<th className="pb-3 font-medium text-muted-foreground">Statut</th>
									<th className="pb-3 font-medium text-muted-foreground">Note</th>
									<th className="pb-3 font-medium text-muted-foreground">Actions</th>
								</tr>
							</thead>
							<tbody>
								{agents.map((agent) => (
									<tr key={agent.id} className="border-b last:border-0">
										<td className="py-3 font-medium">{agent.name}</td>
										<td className="py-3 text-muted-foreground">{agent.creator_name}</td>
										<td className="py-3 capitalize">{agent.category}</td>
										<td className="py-3">
											<Badge variant={statusVariant[agent.status]}>
												{statusLabel[agent.status]}
											</Badge>
										</td>
										<td className="py-3">{agent.rating.toFixed(1)}</td>
										<td className="py-3">
											<div className="flex gap-1">
												<Button variant="ghost" size="icon" asChild>
													<Link href={`/agents/${agent.id}`}>
														<Eye className="h-4 w-4" />
													</Link>
												</Button>
												<Button variant="ghost" size="icon">
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
