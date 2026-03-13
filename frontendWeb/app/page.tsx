import { ArrowRight, Bot, Puzzle, Shield } from "lucide-react";
import Link from "next/link";
import { AgentCard } from "@/components/agents/agent-card";
import { CategoryCard } from "@/components/agents/category-card";
import { Button } from "@/components/ui/button";
import { AGENT_CATEGORIES, getFeaturedAgents, getTrendingAgents } from "@/lib/mock-data";

export default function HomePage() {
	const featured = getFeaturedAgents();
	const trending = getTrendingAgents();

	return (
		<div>
			{/* Hero */}
			<section className="border-b bg-gradient-to-b from-background to-muted/30">
				<div className="container mx-auto flex flex-col items-center px-4 py-20 text-center lg:py-28">
					<div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
						<Bot className="h-4 w-4" />
						La première marketplace ouverte d&apos;agents IA
					</div>
					<h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
						Découvrez, testez et déployez des <span className="text-primary">agents IA</span>
					</h1>
					<p className="mt-6 max-w-2xl text-lg text-muted-foreground">
						Explorez un catalogue d&apos;agents IA créés par la communauté. Testez-les directement
						dans votre navigateur avec votre propre clé API.
					</p>
					<div className="mt-10 flex gap-4">
						<Button size="lg" asChild>
							<Link href="/catalogue">
								Explorer le catalogue
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button size="lg" variant="outline" asChild>
							<Link href="/register">Créer un compte</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Pillars */}
			<section className="border-b">
				<div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-3">
					<div className="flex flex-col items-center text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<Puzzle className="h-6 w-6 text-primary" />
						</div>
						<h3 className="mt-4 font-semibold">Format ouvert .agentjson</h3>
						<p className="mt-2 text-sm text-muted-foreground">
							Un standard ouvert et agnostique pour définir et distribuer des agents IA.
						</p>
					</div>
					<div className="flex flex-col items-center text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<Bot className="h-6 w-6 text-primary" />
						</div>
						<h3 className="mt-4 font-semibold">Multi-modèle</h3>
						<p className="mt-2 text-sm text-muted-foreground">
							Compatible Claude, GPT-4, Gemini, Mistral et plus encore. Utilisez votre propre clé
							API.
						</p>
					</div>
					<div className="flex flex-col items-center text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<Shield className="h-6 w-6 text-primary" />
						</div>
						<h3 className="mt-4 font-semibold">Sécurité par design</h3>
						<p className="mt-2 text-sm text-muted-foreground">
							Permissions déclaratives, analyse statique et sandbox pour chaque agent.
						</p>
					</div>
				</div>
			</section>

			{/* Featured Agents */}
			<section className="border-b">
				<div className="container mx-auto px-4 py-16">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold">Agents populaires</h2>
							<p className="mt-1 text-muted-foreground">
								Les agents les plus utilisés par la communauté
							</p>
						</div>
						<Button variant="ghost" asChild>
							<Link href="/catalogue">
								Voir tout <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</div>
					<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{featured.map((agent) => (
							<AgentCard key={agent.id} agent={agent} />
						))}
					</div>
				</div>
			</section>

			{/* Trending */}
			<section className="border-b">
				<div className="container mx-auto px-4 py-16">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold">Tendances</h2>
							<p className="mt-1 text-muted-foreground">Les agents les mieux notés cette semaine</p>
						</div>
					</div>
					<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{trending.map((agent) => (
							<AgentCard key={agent.id} agent={agent} />
						))}
					</div>
				</div>
			</section>

			{/* Categories */}
			<section>
				<div className="container mx-auto px-4 py-16">
					<h2 className="text-2xl font-bold">Catégories</h2>
					<p className="mt-1 text-muted-foreground">Parcourez les agents par catégorie</p>
					<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{AGENT_CATEGORIES.map((cat) => (
							<CategoryCard key={cat.id} category={cat} />
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
