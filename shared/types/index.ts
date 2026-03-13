export interface Agent {
	id: string;
	name: string;
	slug: string;
	description: string;
	long_description: string | null;
	category: string;
	tags: string[];
	price: number;
	price_type: "free" | "one_time" | "subscription" | "pay_per_use";
	image_url: string | null;
	screenshots: string[];
	creator_id: string;
	creator_name: string | null;
	model: string;
	mode: "local" | "cloud" | "hybrid";
	version: string;
	status: "draft" | "pending" | "published" | "rejected";
	downloads_count: number;
	average_rating: number;
	reviews_count: number;
	sandbox_uses: number;
	created_at: string;
	updated_at: string;
}

export interface UserProfile {
	id: string;
	email: string;
	full_name: string | null;
	avatar_url: string | null;
	bio: string | null;
	role: "user" | "developer" | "admin";
	created_at: string;
	updated_at: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

export interface AgentCategory {
	id: string;
	name: string;
	slug: string;
	description: string;
	icon: string;
	agent_count: number;
}

export interface ApiKeyConfig {
	id: string;
	provider: string;
	label: string;
	key_preview: string;
	created_at: string;
}

export const AGENT_CATEGORIES: AgentCategory[] = [
	{
		id: "1",
		name: "Productivité",
		slug: "productivity",
		description: "Agents pour améliorer votre productivité quotidienne",
		icon: "Zap",
		agent_count: 0,
	},
	{
		id: "2",
		name: "Développement",
		slug: "development",
		description: "Agents pour le développement logiciel",
		icon: "Code",
		agent_count: 0,
	},
	{
		id: "3",
		name: "Rédaction",
		slug: "writing",
		description: "Agents pour la rédaction et la création de contenu",
		icon: "PenTool",
		agent_count: 0,
	},
	{
		id: "4",
		name: "Analyse de données",
		slug: "data-analysis",
		description: "Agents pour l'analyse et la visualisation de données",
		icon: "BarChart3",
		agent_count: 0,
	},
	{
		id: "5",
		name: "Design",
		slug: "design",
		description: "Agents pour le design et la création graphique",
		icon: "Palette",
		agent_count: 0,
	},
	{
		id: "6",
		name: "Marketing",
		slug: "marketing",
		description: "Agents pour le marketing et la communication",
		icon: "Megaphone",
		agent_count: 0,
	},
	{
		id: "7",
		name: "Éducation",
		slug: "education",
		description: "Agents pour l'apprentissage et la formation",
		icon: "GraduationCap",
		agent_count: 0,
	},
	{
		id: "8",
		name: "Autre",
		slug: "other",
		description: "Agents divers et variés",
		icon: "Sparkles",
		agent_count: 0,
	},
];

export const MOCK_AGENTS: Agent[] = [
	{
		id: "1",
		name: "CodeReview Pro",
		slug: "codereview-pro",
		description:
			"Agent spécialisé dans la revue de code avec suggestions d'amélioration détaillées.",
		long_description:
			"CodeReview Pro analyse votre code source et fournit des suggestions d'amélioration détaillées. Il détecte les problèmes de performance, les failles de sécurité, et propose des refactorisations. Compatible avec Python, JavaScript, TypeScript, Go et Rust.",
		category: "development",
		tags: ["code-review", "qualité", "sécurité"],
		price: 0,
		price_type: "free",
		image_url: null,
		screenshots: [],
		creator_id: "dev1",
		creator_name: "Alice Dev",
		model: "claude-sonnet-4-20250514",
		mode: "cloud",
		version: "1.0.0",
		status: "published",
		downloads_count: 234,
		average_rating: 4.7,
		reviews_count: 18,
		sandbox_uses: 0,
		created_at: "2026-02-15T10:00:00Z",
		updated_at: "2026-03-01T14:30:00Z",
	},
	{
		id: "2",
		name: "DataViz Assistant",
		slug: "dataviz-assistant",
		description: "Transformez vos données en visualisations interactives et rapports clairs.",
		long_description:
			"DataViz Assistant prend vos données brutes (CSV, JSON, Excel) et génère des visualisations interactives. Il peut créer des graphiques, des tableaux de bord, et des rapports complets avec des insights automatiques.",
		category: "data-analysis",
		tags: ["data", "visualisation", "rapports"],
		price: 0,
		price_type: "free",
		image_url: null,
		screenshots: [],
		creator_id: "dev2",
		creator_name: "Bob Analytics",
		model: "gpt-4o",
		mode: "cloud",
		version: "2.1.0",
		status: "published",
		downloads_count: 567,
		average_rating: 4.5,
		reviews_count: 32,
		sandbox_uses: 0,
		created_at: "2026-01-20T08:00:00Z",
		updated_at: "2026-03-05T11:00:00Z",
	},
	{
		id: "3",
		name: "ContentWriter AI",
		slug: "contentwriter-ai",
		description: "Rédaction professionnelle d'articles, de blogs et de contenus marketing.",
		long_description:
			"ContentWriter AI est votre assistant de rédaction professionnel. Il génère des articles de blog, des descriptions de produits, des posts pour les réseaux sociaux, et des newsletters. Il s'adapte au ton et au style de votre marque.",
		category: "writing",
		tags: ["rédaction", "contenu", "blog"],
		price: 0,
		price_type: "free",
		image_url: null,
		screenshots: [],
		creator_id: "dev3",
		creator_name: "Clara Rédac",
		model: "claude-sonnet-4-20250514",
		mode: "cloud",
		version: "1.3.0",
		status: "published",
		downloads_count: 891,
		average_rating: 4.8,
		reviews_count: 45,
		sandbox_uses: 0,
		created_at: "2026-02-01T12:00:00Z",
		updated_at: "2026-03-10T09:15:00Z",
	},
	{
		id: "4",
		name: "TaskMaster",
		slug: "taskmaster",
		description: "Organisez vos projets et gérez vos tâches avec un assistant IA intelligent.",
		long_description:
			"TaskMaster vous aide à décomposer vos projets en tâches actionnables, à prioriser votre travail et à suivre votre progression. Il s'intègre avec vos outils existants et vous donne des recommandations personnalisées.",
		category: "productivity",
		tags: ["productivité", "gestion-projet", "organisation"],
		price: 0,
		price_type: "free",
		image_url: null,
		screenshots: [],
		creator_id: "dev1",
		creator_name: "Alice Dev",
		model: "gemini-2.0-flash",
		mode: "cloud",
		version: "1.0.0",
		status: "published",
		downloads_count: 123,
		average_rating: 4.2,
		reviews_count: 8,
		sandbox_uses: 0,
		created_at: "2026-03-01T16:00:00Z",
		updated_at: "2026-03-10T16:00:00Z",
	},
	{
		id: "5",
		name: "DesignCritic",
		slug: "designcritic",
		description: "Obtenez des retours constructifs sur vos designs UI/UX.",
		long_description:
			"DesignCritic analyse vos maquettes et interfaces utilisateur pour fournir des retours constructifs basés sur les principes de design UI/UX. Il évalue l'accessibilité, la hiérarchie visuelle, la cohérence et l'ergonomie.",
		category: "design",
		tags: ["design", "ui-ux", "feedback"],
		price: 0,
		price_type: "free",
		image_url: null,
		screenshots: [],
		creator_id: "dev4",
		creator_name: "Diana Design",
		model: "gpt-4o",
		mode: "cloud",
		version: "1.1.0",
		status: "published",
		downloads_count: 89,
		average_rating: 4.6,
		reviews_count: 12,
		sandbox_uses: 0,
		created_at: "2026-02-20T14:00:00Z",
		updated_at: "2026-03-08T10:00:00Z",
	},
	{
		id: "6",
		name: "SEO Optimizer",
		slug: "seo-optimizer",
		description: "Optimisez le référencement de vos pages web et de votre contenu.",
		long_description:
			"SEO Optimizer analyse votre contenu web et fournit des recommandations SEO détaillées. Il vérifie les méta-descriptions, les titres, la densité de mots-clés, les liens internes et la structure du contenu.",
		category: "marketing",
		tags: ["seo", "marketing", "web"],
		price: 0,
		price_type: "free",
		image_url: null,
		screenshots: [],
		creator_id: "dev5",
		creator_name: "Eve Marketing",
		model: "claude-sonnet-4-20250514",
		mode: "cloud",
		version: "1.0.0",
		status: "published",
		downloads_count: 156,
		average_rating: 4.4,
		reviews_count: 15,
		sandbox_uses: 0,
		created_at: "2026-02-10T09:00:00Z",
		updated_at: "2026-03-07T13:00:00Z",
	},
];
