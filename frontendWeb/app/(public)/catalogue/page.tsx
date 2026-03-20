"use client";

import type { Agent, AgentCategory } from "@claake/shared";
import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AgentCard } from "@/components/agents/agent-card";
import { SearchFilters } from "@/components/catalogue/search-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";

export default function CataloguePage() {
	const [query, setQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [pricingModel, setPricingModel] = useState("all");
	const [mode, setMode] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
	const [agents, setAgents] = useState<Agent[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [categories, setCategories] = useState<AgentCategory[]>([]);

	const fetchAgents = useCallback(async () => {
		try {
			const res = await apiClient.agents.list({
				q: query || undefined,
				category: selectedCategory !== "all" ? selectedCategory : undefined,
				pricing_model: pricingModel !== "all" ? pricingModel : undefined,
				mode: mode !== "all" ? mode : undefined,
				sort_by: sortBy,
				page,
				limit: 24,
			});
			setAgents(res.agents);
			setTotal(res.total);
		} catch {
			// ignore
		}
	}, [query, selectedCategory, pricingModel, mode, sortBy, page]);

	useEffect(() => {
		fetchAgents();
	}, [fetchAgents]);

	useEffect(() => {
		apiClient.categories
			.list()
			.then(setCategories)
			.catch(() => {});
	}, []);

	// Reset page on filter change
	useEffect(() => {
		setPage(1);
	}, [query, selectedCategory, pricingModel, mode, sortBy]);

	const totalPages = Math.ceil(total / 24);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Catalogue des Agents</h1>
				<p className="mt-2 text-muted-foreground">
					Parcourez et d&eacute;couvrez des agents IA cr&eacute;&eacute;s par la communaut&eacute;
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

			{/* Filters */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex flex-wrap gap-2">
					<button type="button" onClick={() => setSelectedCategory("all")}>
						<Badge variant={selectedCategory === "all" ? "default" : "outline"}>Tous</Badge>
					</button>
					{categories.map((cat) => (
						<button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.slug)}>
							<Badge variant={selectedCategory === cat.slug ? "default" : "outline"}>
								{cat.name}
							</Badge>
						</button>
					))}
				</div>
				<SearchFilters
					pricingModel={pricingModel}
					onPricingModelChange={setPricingModel}
					mode={mode}
					onModeChange={setMode}
					sortBy={sortBy}
					onSortByChange={setSortBy}
				/>
			</div>

			{/* Results */}
			{agents.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<Search className="h-12 w-12 text-muted-foreground/30" />
					<h3 className="mt-4 text-lg font-semibold">Aucun agent trouv&eacute;</h3>
					<p className="mt-2 text-sm text-muted-foreground">
						Essayez avec d&apos;autres termes de recherche ou filtres.
					</p>
				</div>
			) : (
				<>
					<p className="mb-4 text-sm text-muted-foreground">
						{total} agent{total > 1 ? "s" : ""} trouv&eacute;
						{total > 1 ? "s" : ""}
					</p>
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{agents.map((agent) => (
							<AgentCard key={agent.id} agent={agent} />
						))}
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="mt-8 flex items-center justify-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								Pr&eacute;c&eacute;dent
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {page} / {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								Suivant
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
