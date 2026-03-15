import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	// Clean existing data (order matters for FK constraints)
	await prisma.creditTransaction.deleteMany();
	await prisma.usageCredit.deleteMany();
	await prisma.favorite.deleteMany();
	await prisma.collection.deleteMany();
	await prisma.review.deleteMany();
	await prisma.subscription.deleteMany();
	await prisma.purchase.deleteMany();
	await prisma.agentVersion.deleteMany();
	await prisma.pipeline.deleteMany();
	await prisma.agent.deleteMany();
	await prisma.user.deleteMany();
	await prisma.team.deleteMany();
	await prisma.category.deleteMany();

	// --- Categories ---
	const categories = [
		{
			name: "Productivité",
			slug: "productivity",
			description: "Agents pour améliorer votre productivité quotidienne",
			icon: "Zap",
			agentCount: 2,
		},
		{
			name: "Développement",
			slug: "development",
			description: "Agents pour le développement logiciel",
			icon: "Code",
			agentCount: 1,
		},
		{
			name: "Rédaction",
			slug: "writing",
			description: "Agents pour la rédaction et la création de contenu",
			icon: "PenTool",
			agentCount: 1,
		},
		{
			name: "Analyse de données",
			slug: "data-analysis",
			description: "Agents pour l'analyse et la visualisation de données",
			icon: "BarChart3",
			agentCount: 1,
		},
		{
			name: "Design",
			slug: "design",
			description: "Agents pour le design et la création graphique",
			icon: "Palette",
			agentCount: 1,
		},
		{
			name: "Marketing",
			slug: "marketing",
			description: "Agents pour le marketing et la communication",
			icon: "Megaphone",
			agentCount: 1,
		},
		{
			name: "Éducation",
			slug: "education",
			description: "Agents pour l'apprentissage et la formation",
			icon: "GraduationCap",
		},
		{
			name: "Autre",
			slug: "other",
			description: "Agents divers et variés",
			icon: "Sparkles",
		},
	];

	for (const cat of categories) {
		await prisma.category.create({ data: cat });
	}
	console.log(`Seeded ${categories.length} categories`);

	// --- Team ---
	const team = await prisma.team.create({
		data: {
			name: "Claake Devs",
			ownerId: "placeholder",
			plan: "TEAM",
		},
	});

	// --- Users ---
	const alice = await prisma.user.create({
		data: {
			email: "alice@example.com",
			displayName: "Alice Dev",
			role: "CREATOR",
			stripeAccountId: "acct_alice_test",
			teamId: team.id,
		},
	});
	const bob = await prisma.user.create({
		data: {
			email: "bob@example.com",
			displayName: "Bob Analytics",
			role: "CREATOR",
			stripeAccountId: "acct_bob_test",
			teamId: team.id,
		},
	});
	const clara = await prisma.user.create({
		data: {
			email: "clara@example.com",
			displayName: "Clara Rédac",
			role: "CREATOR",
			stripeAccountId: "acct_clara_test",
		},
	});
	const diana = await prisma.user.create({
		data: {
			email: "diana@example.com",
			displayName: "Diana Design",
			role: "CREATOR",
		},
	});
	const eve = await prisma.user.create({
		data: {
			email: "eve@example.com",
			displayName: "Eve Marketing",
			role: "CREATOR",
		},
	});
	const frank = await prisma.user.create({
		data: {
			email: "frank@example.com",
			displayName: "Frank User",
			role: "USER",
		},
	});
	const grace = await prisma.user.create({
		data: {
			email: "grace@example.com",
			displayName: "Grace Buyer",
			role: "USER",
		},
	});

	await prisma.user.create({
		data: {
			email: "superadmin@claake.com",
			displayName: "Super Admin",
			role: "SUPER_ADMIN",
		},
	});
	await prisma.user.create({
		data: {
			email: "admin@claake.com",
			displayName: "Admin Modérateur",
			role: "ADMIN",
			adminPermissions: {
				canManageUsers: false,
				canManageAgents: true,
				canManageCategories: true,
				canManageReviews: true,
				canViewStats: true,
				canViewActivity: true,
			},
		},
	});

	// Update team owner
	await prisma.team.update({
		where: { id: team.id },
		data: { ownerId: alice.id },
	});

	console.log("Seeded 9 users + 1 team");

	// --- Agents ---
	const codeReview = await prisma.agent.create({
		data: {
			name: "CodeReview Pro",
			slug: "codereview-pro",
			description:
				"Agent spécialisé dans la revue de code avec suggestions d'amélioration détaillées.",
			longDescription:
				"CodeReview Pro analyse votre code source et fournit des suggestions d'amélioration détaillées. Il détecte les problèmes de performance, les failles de sécurité, et propose des refactorisations. Compatible avec Python, JavaScript, TypeScript, Go et Rust.",
			category: "development",
			tags: ["code-review", "qualité", "sécurité"],
			models: ["claude-sonnet-4-20250514"],
			mode: "CLOUD",
			pricingModel: "FREE",
			price: 0,
			status: "APPROVED",
			downloadCount: 234,
			rating: 4.7,
			reviewCount: 18,
			permissions: { network: true, filesystem: { read: true } },
			creatorId: alice.id,
			createdAt: new Date("2026-02-15T10:00:00Z"),
			updatedAt: new Date("2026-03-01T14:30:00Z"),
		},
	});

	const dataViz = await prisma.agent.create({
		data: {
			name: "DataViz Assistant",
			slug: "dataviz-assistant",
			description: "Transformez vos données en visualisations interactives et rapports clairs.",
			longDescription:
				"DataViz Assistant prend vos données brutes (CSV, JSON, Excel) et génère des visualisations interactives. Il peut créer des graphiques, des tableaux de bord, et des rapports complets avec des insights automatiques.",
			category: "data-analysis",
			tags: ["data", "visualisation", "rapports"],
			models: ["gpt-4o"],
			mode: "CLOUD",
			pricingModel: "ONE_TIME",
			price: 9.99,
			status: "APPROVED",
			downloadCount: 567,
			rating: 4.5,
			reviewCount: 32,
			permissions: { network: true, filesystem: { read: true, write: true } },
			creatorId: bob.id,
			createdAt: new Date("2026-01-20T08:00:00Z"),
			updatedAt: new Date("2026-03-05T11:00:00Z"),
		},
	});

	const contentWriter = await prisma.agent.create({
		data: {
			name: "ContentWriter AI",
			slug: "contentwriter-ai",
			description: "Rédaction professionnelle d'articles, de blogs et de contenus marketing.",
			longDescription:
				"ContentWriter AI est votre assistant de rédaction professionnel. Il génère des articles de blog, des descriptions de produits, des posts pour les réseaux sociaux, et des newsletters. Il s'adapte au ton et au style de votre marque.",
			category: "writing",
			tags: ["rédaction", "contenu", "blog"],
			models: ["claude-sonnet-4-20250514"],
			mode: "CLOUD",
			pricingModel: "SUBSCRIPTION",
			price: 4.99,
			status: "APPROVED",
			downloadCount: 891,
			rating: 4.8,
			reviewCount: 45,
			permissions: { network: true, clipboard: true },
			creatorId: clara.id,
			createdAt: new Date("2026-02-01T12:00:00Z"),
			updatedAt: new Date("2026-03-10T09:15:00Z"),
		},
	});

	const taskMaster = await prisma.agent.create({
		data: {
			name: "TaskMaster",
			slug: "taskmaster",
			description: "Organisez vos projets et gérez vos tâches avec un assistant IA intelligent.",
			longDescription:
				"TaskMaster vous aide à décomposer vos projets en tâches actionnables, à prioriser votre travail et à suivre votre progression. Il s'intègre avec vos outils existants et vous donne des recommandations personnalisées.",
			category: "productivity",
			tags: ["productivité", "gestion-projet", "organisation"],
			models: ["gemini-2.0-flash"],
			mode: "CLOUD",
			pricingModel: "PAY_PER_USE",
			price: 0,
			creditCost: 5,
			status: "APPROVED",
			downloadCount: 123,
			rating: 4.2,
			reviewCount: 8,
			permissions: { network: true },
			creatorId: alice.id,
			createdAt: new Date("2026-03-01T16:00:00Z"),
			updatedAt: new Date("2026-03-10T16:00:00Z"),
		},
	});

	const designCritic = await prisma.agent.create({
		data: {
			name: "DesignCritic",
			slug: "designcritic",
			description: "Obtenez des retours constructifs sur vos designs UI/UX.",
			longDescription:
				"DesignCritic analyse vos maquettes et interfaces utilisateur pour fournir des retours constructifs basés sur les principes de design UI/UX. Il évalue l'accessibilité, la hiérarchie visuelle, la cohérence et l'ergonomie.",
			category: "design",
			tags: ["design", "ui-ux", "feedback"],
			models: ["gpt-4o"],
			mode: "CLOUD",
			pricingModel: "ONE_TIME",
			price: 14.99,
			status: "APPROVED",
			downloadCount: 89,
			rating: 4.6,
			reviewCount: 12,
			permissions: { network: true, filesystem: { read: true } },
			creatorId: diana.id,
			createdAt: new Date("2026-02-20T14:00:00Z"),
			updatedAt: new Date("2026-03-08T10:00:00Z"),
		},
	});

	const seoOptimizer = await prisma.agent.create({
		data: {
			name: "SEO Optimizer",
			slug: "seo-optimizer",
			description: "Optimisez le référencement de vos pages web et de votre contenu.",
			longDescription:
				"SEO Optimizer analyse votre contenu web et fournit des recommandations SEO détaillées. Il vérifie les méta-descriptions, les titres, la densité de mots-clés, les liens internes et la structure du contenu.",
			category: "marketing",
			tags: ["seo", "marketing", "web"],
			models: ["claude-sonnet-4-20250514"],
			mode: "CLOUD",
			pricingModel: "FREE",
			price: 0,
			status: "APPROVED",
			downloadCount: 156,
			rating: 4.4,
			reviewCount: 15,
			permissions: { network: true },
			creatorId: eve.id,
			createdAt: new Date("2026-02-10T09:00:00Z"),
			updatedAt: new Date("2026-03-07T13:00:00Z"),
		},
	});

	await prisma.agent.create({
		data: {
			name: "MeetingSummarizer",
			slug: "meeting-summarizer",
			description: "Résumez automatiquement vos réunions et générez des comptes-rendus.",
			category: "productivity",
			tags: ["réunion", "résumé", "productivité"],
			models: ["claude-sonnet-4-20250514"],
			mode: "LOCAL",
			pricingModel: "FREE",
			price: 0,
			status: "DRAFT",
			permissions: { microphone: true, network: true },
			creatorId: alice.id,
		},
	});

	console.log("Seeded 7 agents");

	// --- Agent Versions ---
	const versions = [
		{
			agentId: codeReview.id,
			version: "1.0.0",
			configUrl: "https://storage.claake.dev/agents/codereview-pro/1.0.0.agentjson",
			changelog: "Version initiale avec support Python, JS, TS.",
			securityScanStatus: "PASSED" as const,
			isActive: true,
			createdAt: new Date("2026-02-15T10:00:00Z"),
		},
		{
			agentId: codeReview.id,
			version: "1.1.0",
			configUrl: "https://storage.claake.dev/agents/codereview-pro/1.1.0.agentjson",
			changelog: "Ajout du support Go et Rust. Amélioration de la détection de failles.",
			securityScanStatus: "PASSED" as const,
			isActive: true,
			createdAt: new Date("2026-03-01T14:30:00Z"),
		},
		{
			agentId: dataViz.id,
			version: "2.1.0",
			configUrl: "https://storage.claake.dev/agents/dataviz-assistant/2.1.0.agentjson",
			changelog: "Support Excel natif, nouveaux types de graphiques.",
			securityScanStatus: "PASSED" as const,
			isActive: true,
			createdAt: new Date("2026-03-05T11:00:00Z"),
		},
		{
			agentId: contentWriter.id,
			version: "1.3.0",
			configUrl: "https://storage.claake.dev/agents/contentwriter-ai/1.3.0.agentjson",
			changelog: "Amélioration du ton adaptatif, support newsletters.",
			securityScanStatus: "PASSED" as const,
			isActive: true,
			createdAt: new Date("2026-03-10T09:15:00Z"),
		},
		{
			agentId: taskMaster.id,
			version: "1.0.0",
			configUrl: "https://storage.claake.dev/agents/taskmaster/1.0.0.agentjson",
			changelog: "Version initiale.",
			securityScanStatus: "PASSED" as const,
			isActive: true,
			createdAt: new Date("2026-03-01T16:00:00Z"),
		},
	];

	for (const v of versions) {
		await prisma.agentVersion.create({ data: v });
	}
	console.log(`Seeded ${versions.length} agent versions`);

	// --- Purchases (acheteurs) ---
	const purchases = [
		{
			userId: frank.id,
			agentId: dataViz.id,
			amount: 9.99,
			currency: "eur",
			stripePaymentId: "pi_test_frank_dataviz",
			createdAt: new Date("2026-02-25T14:00:00Z"),
		},
		{
			userId: frank.id,
			agentId: designCritic.id,
			amount: 14.99,
			currency: "eur",
			stripePaymentId: "pi_test_frank_designcritic",
			createdAt: new Date("2026-03-05T10:00:00Z"),
		},
		{
			userId: grace.id,
			agentId: dataViz.id,
			amount: 9.99,
			currency: "eur",
			stripePaymentId: "pi_test_grace_dataviz",
			createdAt: new Date("2026-03-01T09:00:00Z"),
		},
		{
			userId: grace.id,
			agentId: designCritic.id,
			amount: 14.99,
			currency: "eur",
			stripePaymentId: "pi_test_grace_designcritic",
			createdAt: new Date("2026-03-08T16:00:00Z"),
		},
	];

	for (const p of purchases) {
		await prisma.purchase.create({ data: p });
	}
	console.log(`Seeded ${purchases.length} purchases`);

	// --- Subscriptions ---
	await prisma.subscription.create({
		data: {
			userId: frank.id,
			agentId: contentWriter.id,
			stripeSubId: "sub_test_frank_contentwriter",
			status: "ACTIVE",
			currentPeriodEnd: new Date("2026-04-10T09:15:00Z"),
			createdAt: new Date("2026-03-10T09:15:00Z"),
		},
	});
	await prisma.subscription.create({
		data: {
			userId: grace.id,
			agentId: contentWriter.id,
			stripeSubId: "sub_test_grace_contentwriter",
			status: "ACTIVE",
			currentPeriodEnd: new Date("2026-04-12T11:00:00Z"),
			createdAt: new Date("2026-03-12T11:00:00Z"),
		},
	});
	console.log("Seeded 2 subscriptions");

	// --- Usage Credits (pay-per-use) ---
	const frankCredits = await prisma.usageCredit.create({
		data: {
			userId: frank.id,
			balance: 480,
		},
	});
	await prisma.creditTransaction.create({
		data: {
			usageCreditId: frankCredits.id,
			amount: 500,
			reason: "Achat pack 5€ — 500 crédits",
		},
	});
	await prisma.creditTransaction.create({
		data: {
			usageCreditId: frankCredits.id,
			amount: -20,
			reason: "4 interactions TaskMaster (5 crédits/interaction)",
		},
	});

	const graceCredits = await prisma.usageCredit.create({
		data: {
			userId: grace.id,
			balance: 2200,
		},
	});
	await prisma.creditTransaction.create({
		data: {
			usageCreditId: graceCredits.id,
			amount: 2200,
			reason: "Achat pack 20€ — 2200 crédits",
		},
	});
	console.log("Seeded usage credits + transactions");

	// --- Reviews ---
	const reviews = [
		{
			userId: frank.id,
			agentId: codeReview.id,
			rating: 5,
			comment: "Excellent agent, détecte des failles que j'aurais ratées. Le support Go est top !",
			verifiedPurchase: false,
			helpfulCount: 12,
			createdAt: new Date("2026-03-02T10:00:00Z"),
		},
		{
			userId: grace.id,
			agentId: codeReview.id,
			rating: 4,
			comment: "Très bon, mais parfois trop verbeux dans les suggestions.",
			verifiedPurchase: false,
			helpfulCount: 5,
			createdAt: new Date("2026-03-04T15:00:00Z"),
		},
		{
			userId: frank.id,
			agentId: dataViz.id,
			rating: 5,
			comment: "Les graphiques générés sont magnifiques. Le support Excel est un game changer.",
			verifiedPurchase: true,
			helpfulCount: 8,
			createdAt: new Date("2026-03-06T09:00:00Z"),
		},
		{
			userId: grace.id,
			agentId: dataViz.id,
			rating: 4,
			comment: "Bon outil, manque encore quelques types de graphiques avancés.",
			verifiedPurchase: true,
			helpfulCount: 3,
			createdAt: new Date("2026-03-09T14:00:00Z"),
		},
		{
			userId: frank.id,
			agentId: contentWriter.id,
			rating: 5,
			comment: "Incroyable pour les newsletters. Le ton s'adapte parfaitement à ma marque.",
			verifiedPurchase: true,
			helpfulCount: 15,
			createdAt: new Date("2026-03-11T11:00:00Z"),
		},
		{
			userId: frank.id,
			agentId: designCritic.id,
			rating: 4,
			comment: "Retours pertinents sur l'accessibilité. Très utile en complément de Figma.",
			verifiedPurchase: true,
			helpfulCount: 6,
			createdAt: new Date("2026-03-07T16:00:00Z"),
		},
	];

	for (const r of reviews) {
		await prisma.review.create({ data: r });
	}
	console.log(`Seeded ${reviews.length} reviews`);

	// --- Favorites ---
	const favs = [
		{ userId: frank.id, agentId: codeReview.id },
		{ userId: frank.id, agentId: contentWriter.id },
		{ userId: frank.id, agentId: seoOptimizer.id },
		{ userId: grace.id, agentId: dataViz.id },
		{ userId: grace.id, agentId: designCritic.id },
		{ userId: grace.id, agentId: taskMaster.id },
	];

	for (const f of favs) {
		await prisma.favorite.create({ data: f });
	}
	console.log(`Seeded ${favs.length} favorites`);

	// --- Collections ---
	await prisma.collection.create({
		data: {
			userId: frank.id,
			name: "Mes outils de dev",
			description: "Agents pour améliorer mon workflow de développement",
			isPublic: true,
			agentIds: [codeReview.id, dataViz.id],
		},
	});
	await prisma.collection.create({
		data: {
			userId: grace.id,
			name: "Marketing toolkit",
			description: "Agents pour le marketing et la communication",
			isPublic: false,
			agentIds: [contentWriter.id, seoOptimizer.id],
		},
	});
	console.log("Seeded 2 collections");

	// --- Pipelines ---
	await prisma.pipeline.create({
		data: {
			userId: frank.id,
			name: "Content Pipeline",
			description: "Rédaction → SEO → Publication",
			agentSequence: [
				{ agentId: contentWriter.id, step: 1, config: { tone: "professional" } },
				{ agentId: seoOptimizer.id, step: 2, config: {} },
			],
			isPublic: true,
		},
	});
	console.log("Seeded 1 pipeline");
}

main()
	.then(async () => {
		await prisma.$disconnect();
		console.log("Seed completed successfully!");
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
