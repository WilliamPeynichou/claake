"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AgentCard } from "@/components/agents/agent-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AGENT_CATEGORIES, searchAgents } from "@/lib/mock-data";

export default function CataloguePage() {
	const [query, setQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");

	const results = useMemo(() => searchAgents(query, selectedCategory), [query, selectedCategory]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Catalogue des Agents</h1>
				<p className="mt-2 text-muted-foreground">
					Parcourez et découvrez des agents IA créés par la communauté
				</p>
			</div>

			{/* Search */}
			<div className="relative mb-6">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Rechercher un agent par nom, description ou tag..."
					className="pl-10"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</div>

			{/* Category filters */}
			<div className="mb-8 flex flex-wrap gap-2">
				<button type="button" onClick={() => setSelectedCategory("all")}>
					<Badge variant={selectedCategory === "all" ? "default" : "outline"}>Tous</Badge>
				</button>
				{AGENT_CATEGORIES.map((cat) => (
					<button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.slug)}>
						<Badge variant={selectedCategory === cat.slug ? "default" : "outline"}>
							{cat.name}
						</Badge>
					</button>
				))}
			</div>

			{/* Results */}
			{results.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<Search className="h-12 w-12 text-muted-foreground/30" />
					<h3 className="mt-4 text-lg font-semibold">Aucun agent trouvé</h3>
					<p className="mt-2 text-sm text-muted-foreground">
						Essayez avec d&apos;autres termes de recherche ou filtres.
					</p>
				</div>
			) : (
				<>
					<p className="mb-4 text-sm text-muted-foreground">
						{results.length} agent{results.length > 1 ? "s" : ""} trouvé
						{results.length > 1 ? "s" : ""}
					</p>
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{results.map((agent) => (
							<AgentCard key={agent.id} agent={agent} />
						))}
					</div>
				</>
			)}
		</div>
	);
}
