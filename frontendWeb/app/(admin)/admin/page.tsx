"use client";

import type { AdminStats } from "@agentplace/shared";
import { Bot, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export default function AdminDashboardPage() {
	const [stats, setStats] = useState<AdminStats | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function loadStats() {
			const token = await getAccessToken();
			if (!token) return;

			try {
				const nextStats = await apiClient.stats.admin(token);
				if (isMounted) {
					setStats(nextStats);
				}
			} catch {}
		}

		loadStats();

		return () => {
			isMounted = false;
		};
	}, []);

	const statCards = [
		{
			title: "Agents publiés",
			value: String(stats?.published_agents ?? "—"),
			icon: Bot,
			change: "",
		},
		{ title: "Utilisateurs", value: String(stats?.users ?? "—"), icon: Users, change: "" },
		{
			title: "En attente de revue",
			value: String(stats?.pending_review ?? "—"),
			icon: ShieldCheck,
			change: "",
		},
		{
			title: "Sessions de chat",
			value: String(stats?.chat_sessions ?? "—"),
			icon: TrendingUp,
			change: "",
		},
	];

	return (
		<div>
			<h1 className="text-3xl font-bold">Administration</h1>
			<p className="mt-2 text-muted-foreground">Vue d&apos;ensemble de la plateforme AgentPlace.</p>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{statCards.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{stat.title}
							</CardTitle>
							<stat.icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							{stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
