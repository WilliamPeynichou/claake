import { Bot, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
	{ title: "Agents publiés", value: "6", icon: Bot, change: "+2 cette semaine" },
	{ title: "Utilisateurs", value: "12", icon: Users, change: "+5 cette semaine" },
	{ title: "En attente de revue", value: "0", icon: ShieldCheck, change: "File vide" },
	{ title: "Sessions de chat", value: "48", icon: TrendingUp, change: "+15 cette semaine" },
];

export default function AdminDashboardPage() {
	return (
		<div>
			<h1 className="text-3xl font-bold">Administration</h1>
			<p className="mt-2 text-muted-foreground">Vue d&apos;ensemble de la plateforme AgentPlace.</p>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{stat.title}
							</CardTitle>
							<stat.icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							<p className="text-xs text-muted-foreground">{stat.change}</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
