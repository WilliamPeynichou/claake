import { Bot, Download, MessageSquare, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
	{
		title: "Agents utilisés",
		value: "3",
		icon: Bot,
		description: "Agents dans votre bibliothèque",
	},
	{
		title: "Conversations",
		value: "12",
		icon: MessageSquare,
		description: "Sessions de chat ce mois",
	},
	{
		title: "Agents publiés",
		value: "0",
		icon: Download,
		description: "Agents créés par vous",
	},
	{
		title: "Note moyenne",
		value: "—",
		icon: Star,
		description: "Note de vos agents",
	},
];

export default function DashboardPage() {
	return (
		<div>
			<h1 className="text-3xl font-bold">Tableau de bord</h1>
			<p className="mt-2 text-muted-foreground">Bienvenue sur votre espace personnel AgentPlace.</p>

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
							<p className="text-xs text-muted-foreground">{stat.description}</p>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="mt-8">
				<h2 className="text-xl font-semibold">Activité récente</h2>
				<div className="mt-4 rounded-md border p-8 text-center text-muted-foreground">
					<MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/30" />
					<p className="mt-2 text-sm">Aucune activité récente</p>
					<p className="text-xs">Commencez par explorer le catalogue et discuter avec un agent.</p>
				</div>
			</div>
		</div>
	);
}
