"use client";

import type { AdminStats } from "@claake/shared";
import { BarChart3, Bot, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function AdminStatsPage() {
	const { token } = useAuth();
	const [stats, setStats] = useState<AdminStats | null>(null);

	useEffect(() => {
		if (!token) return;
		apiClient.stats
			.admin(token)
			.then(setStats)
			.catch(() => {});
	}, [token]);

	return (
		<div>
			<h1 className="text-3xl font-bold">Statistiques</h1>
			<p className="mt-2 text-muted-foreground">
				Statistiques détaillées de la plateforme Claake.
			</p>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Agents publiés
						</CardTitle>
						<Bot className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats?.published_agents ?? "—"}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Utilisateurs
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats?.users ?? "—"}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
						<ShieldCheck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats?.pending_review ?? "—"}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats?.chat_sessions ?? "—"}</div>
					</CardContent>
				</Card>
			</div>

			<Card className="mt-8">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<BarChart3 className="h-5 w-5" />
						Graphiques détaillés
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<BarChart3 className="h-12 w-12 text-muted-foreground/30" />
						<h3 className="mt-4 text-lg font-semibold">Bientôt disponible</h3>
						<p className="mt-2 max-w-sm text-sm text-muted-foreground">
							Les graphiques d&apos;évolution (inscriptions, agents créés, revenus) seront
							disponibles dans une prochaine version.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
