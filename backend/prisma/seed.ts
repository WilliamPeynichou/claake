import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	// Clean existing data
	await prisma.agent.deleteMany();
	await prisma.user.deleteMany();
	await prisma.category.deleteMany();

	// --- Categories ---
	const categories = [
		{
			name: "Productivité",
			slug: "productivity",
			description: "Agents pour améliorer votre productivité quotidienne",
			icon: "Zap",
		},
		{
			name: "Développement",
			slug: "development",
			description: "Agents pour le développement logiciel",
			icon: "Code",
		},
		{
			name: "Rédaction",
			slug: "writing",
			description: "Agents pour la rédaction et la création de contenu",
			icon: "PenTool",
		},
		{
			name: "Analyse de données",
			slug: "data-analysis",
			description: "Agents pour l'analyse et la visualisation de données",
			icon: "BarChart3",
		},
		{
			name: "Design",
			slug: "design",
			description: "Agents pour le design et la création graphique",
			icon: "Palette",
		},
		{
			name: "Marketing",
			slug: "marketing",
			description: "Agents pour le marketing et la communication",
			icon: "Megaphone",
		},
		{
			name: "Éducation",
			slug: "education",
			description: "Agents pour l'apprentissage et la formation",
			icon: "GraduationCap",
		},
		{ name: "Autre", slug: "other", description: "Agents divers et variés", icon: "Sparkles" },
	];

	for (const cat of categories) {
		await prisma.category.create({ data: cat });
	}
	console.log(`Seeded ${categories.length} categories`);

	// --- Users ---
	const users = await Promise.all([
		prisma.user.create({
			data: { email: "alice@example.com", fullName: "Alice Dev", role: "CREATOR" },
		}),
		prisma.user.create({
			data: { email: "bob@example.com", fullName: "Bob Analytics", role: "CREATOR" },
		}),
		prisma.user.create({
			data: { email: "clara@example.com", fullName: "Clara Rédac", role: "CREATOR" },
		}),
		prisma.user.create({
			data: { email: "diana@example.com", fullName: "Diana Design", role: "CREATOR" },
		}),
		prisma.user.create({
			data: { email: "eve@example.com", fullName: "Eve Marketing", role: "CREATOR" },
		}),
		prisma.user.create({
			data: { email: "frank@example.com", fullName: "Frank User", role: "USER" },
		}),
	]);
	console.log(`Seeded ${users.length} users`);

	const [alice, bob, clara, diana, eve] = users;

	// --- Agents ---
	const agents = [
		{
			name: "CodeReview Pro",
			slug: "codereview-pro",
			description:
				"Agent spécialisé dans la revue de code avec suggestions d'amélioration détaillées.",
			longDescription:
				"CodeReview Pro analyse votre code source et fournit des suggestions d'amélioration détaillées. Il détecte les problèmes de performance, les failles de sécurité, et propose des refactorisations. Compatible avec Python, JavaScript, TypeScript, Go et Rust.",
			category: "development",
			tags: ["code-review", "qualité", "sécurité"],
			price: 0,
			priceType: "FREE" as const,
			model: "claude-sonnet-4-20250514",
			mode: "CLOUD" as const,
			version: "1.0.0",
			status: "PUBLISHED" as const,
			downloadsCount: 234,
			averageRating: 4.7,
			reviewsCount: 18,
			creatorId: alice.id,
			createdAt: new Date("2026-02-15T10:00:00Z"),
			updatedAt: new Date("2026-03-01T14:30:00Z"),
		},
		{
			name: "DataViz Assistant",
			slug: "dataviz-assistant",
			description: "Transformez vos données en visualisations interactives et rapports clairs.",
			longDescription:
				"DataViz Assistant prend vos données brutes (CSV, JSON, Excel) et génère des visualisations interactives. Il peut créer des graphiques, des tableaux de bord, et des rapports complets avec des insights automatiques.",
			category: "data-analysis",
			tags: ["data", "visualisation", "rapports"],
			price: 0,
			priceType: "FREE" as const,
			model: "gpt-4o",
			mode: "CLOUD" as const,
			version: "2.1.0",
			status: "PUBLISHED" as const,
			downloadsCount: 567,
			averageRating: 4.5,
			reviewsCount: 32,
			creatorId: bob.id,
			createdAt: new Date("2026-01-20T08:00:00Z"),
			updatedAt: new Date("2026-03-05T11:00:00Z"),
		},
		{
			name: "ContentWriter AI",
			slug: "contentwriter-ai",
			description: "Rédaction professionnelle d'articles, de blogs et de contenus marketing.",
			longDescription:
				"ContentWriter AI est votre assistant de rédaction professionnel. Il génère des articles de blog, des descriptions de produits, des posts pour les réseaux sociaux, et des newsletters. Il s'adapte au ton et au style de votre marque.",
			category: "writing",
			tags: ["rédaction", "contenu", "blog"],
			price: 0,
			priceType: "FREE" as const,
			model: "claude-sonnet-4-20250514",
			mode: "CLOUD" as const,
			version: "1.3.0",
			status: "PUBLISHED" as const,
			downloadsCount: 891,
			averageRating: 4.8,
			reviewsCount: 45,
			creatorId: clara.id,
			createdAt: new Date("2026-02-01T12:00:00Z"),
			updatedAt: new Date("2026-03-10T09:15:00Z"),
		},
		{
			name: "TaskMaster",
			slug: "taskmaster",
			description: "Organisez vos projets et gérez vos tâches avec un assistant IA intelligent.",
			longDescription:
				"TaskMaster vous aide à décomposer vos projets en tâches actionnables, à prioriser votre travail et à suivre votre progression. Il s'intègre avec vos outils existants et vous donne des recommandations personnalisées.",
			category: "productivity",
			tags: ["productivité", "gestion-projet", "organisation"],
			price: 0,
			priceType: "FREE" as const,
			model: "gemini-2.0-flash",
			mode: "CLOUD" as const,
			version: "1.0.0",
			status: "PUBLISHED" as const,
			downloadsCount: 123,
			averageRating: 4.2,
			reviewsCount: 8,
			creatorId: alice.id,
			createdAt: new Date("2026-03-01T16:00:00Z"),
			updatedAt: new Date("2026-03-10T16:00:00Z"),
		},
		{
			name: "DesignCritic",
			slug: "designcritic",
			description: "Obtenez des retours constructifs sur vos designs UI/UX.",
			longDescription:
				"DesignCritic analyse vos maquettes et interfaces utilisateur pour fournir des retours constructifs basés sur les principes de design UI/UX. Il évalue l'accessibilité, la hiérarchie visuelle, la cohérence et l'ergonomie.",
			category: "design",
			tags: ["design", "ui-ux", "feedback"],
			price: 0,
			priceType: "FREE" as const,
			model: "gpt-4o",
			mode: "CLOUD" as const,
			version: "1.1.0",
			status: "PUBLISHED" as const,
			downloadsCount: 89,
			averageRating: 4.6,
			reviewsCount: 12,
			creatorId: diana.id,
			createdAt: new Date("2026-02-20T14:00:00Z"),
			updatedAt: new Date("2026-03-08T10:00:00Z"),
		},
		{
			name: "SEO Optimizer",
			slug: "seo-optimizer",
			description: "Optimisez le référencement de vos pages web et de votre contenu.",
			longDescription:
				"SEO Optimizer analyse votre contenu web et fournit des recommandations SEO détaillées. Il vérifie les méta-descriptions, les titres, la densité de mots-clés, les liens internes et la structure du contenu.",
			category: "marketing",
			tags: ["seo", "marketing", "web"],
			price: 0,
			priceType: "FREE" as const,
			model: "claude-sonnet-4-20250514",
			mode: "CLOUD" as const,
			version: "1.0.0",
			status: "PUBLISHED" as const,
			downloadsCount: 156,
			averageRating: 4.4,
			reviewsCount: 15,
			creatorId: eve.id,
			createdAt: new Date("2026-02-10T09:00:00Z"),
			updatedAt: new Date("2026-03-07T13:00:00Z"),
		},
	];

	for (const agent of agents) {
		await prisma.agent.create({ data: agent });
	}
	console.log(`Seeded ${agents.length} agents`);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
