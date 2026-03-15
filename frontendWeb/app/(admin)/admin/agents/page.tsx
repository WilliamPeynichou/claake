"use client";

import type { Agent } from "@claake/shared";
import { Eye, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";

const statusLabel: Record<string, string> = {
	approved: "Publié",
	pending: "En attente",
	draft: "Brouillon",
	rejected: "Rejeté",
	suspended: "Suspendu",
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
	approved: "default",
	pending: "secondary",
	draft: "outline",
	rejected: "destructive",
	suspended: "destructive",
};

export default function AdminAgentsPage() {
	const [agents, setAgents] = useState<Agent[]>([]);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	useEffect(() => {
		apiClient.agents
			.list({ all: true })
			.then((res) => setAgents(res.agents))
			.catch(() => {});
	}, []);

	const filtered = agents.filter((a) => {
		const matchesSearch =
			a.name.toLowerCase().includes(search.toLowerCase()) ||
			(a.creator_name ?? "").toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter === "all" || a.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	return (
		<div>
			<h1 className="text-3xl font-bold">Gestion des agents</h1>
			<p className="mt-2 text-muted-foreground">Gérez tous les agents de la plateforme.</p>

			<div className="mt-6 flex flex-wrap items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Rechercher par nom ou créateur..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-1">
					{["all", "approved", "pending", "draft", "rejected", "suspended"].map((s) => (
						<Button
							key={s}
							variant={statusFilter === s ? "default" : "outline"}
							size="sm"
							onClick={() => setStatusFilter(s)}
						>
							{s === "all" ? "Tous" : (statusLabel[s] ?? s)}
						</Button>
					))}
				</div>
			</div>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle className="text-lg">Agents ({filtered.length})</CardTitle>
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
								{filtered.map((agent) => (
									<tr key={agent.id} className="border-b last:border-0">
										<td className="py-3 font-medium">{agent.name}</td>
										<td className="py-3 text-muted-foreground">{agent.creator_name}</td>
										<td className="py-3 capitalize">{agent.category}</td>
										<td className="py-3">
											<Badge variant={statusVariant[agent.status] ?? "outline"}>
												{statusLabel[agent.status] ?? agent.status}
											</Badge>
										</td>
										<td className="py-3">{Number(agent.rating).toFixed(1)}</td>
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
