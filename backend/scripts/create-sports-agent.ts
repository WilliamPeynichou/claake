/**
 * Script de création d'un agent sport de test sur Claake.
 *
 * Usage :
 *   ANTHROPIC_API_KEY=sk-ant-xxx ts-node backend/scripts/create-sports-agent.ts
 *
 * Variables d'environnement :
 *   ANTHROPIC_API_KEY   (obligatoire) — ta clé API Anthropic
 *   CREATOR_EMAIL       (optionnel)   — email du compte Claake à utiliser comme créateur
 *                                       si absent, prend le premier CREATOR/ADMIN trouvé en DB
 */

import * as dotenv from "dotenv";
import * as path from "node:path";
import { createCipheriv, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

// Réplique de AesEncryptionService — même algo AES-256-GCM
function encrypt(plaintext: string): string {
	const hexKey = process.env.ENCRYPTION_KEY;
	if (!hexKey || hexKey.length !== 64) {
		throw new Error("ENCRYPTION_KEY manquante ou invalide dans .env (doit être 64 chars hex)");
	}
	const key = Buffer.from(hexKey, "hex");
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

async function main() {
	const anthropicKey = process.env.ANTHROPIC_API_KEY;
	if (!anthropicKey) {
		throw new Error("ANTHROPIC_API_KEY est requise. Relance avec : ANTHROPIC_API_KEY=sk-ant-... ts-node backend/scripts/create-sports-agent.ts");
	}

	// 1. Trouver le créateur
	const creatorEmail = process.env.CREATOR_EMAIL;
	const creator = creatorEmail
		? await prisma.user.findUnique({ where: { email: creatorEmail } })
		: await prisma.user.findFirst({ where: { role: { in: ["CREATOR", "ADMIN", "SUPER_ADMIN"] } } });

	if (!creator) {
		throw new Error(
			creatorEmail
				? `Aucun utilisateur trouvé avec l'email "${creatorEmail}"`
				: "Aucun utilisateur CREATOR/ADMIN trouvé en DB. Lance le seed d'abord ou précise CREATOR_EMAIL.",
		);
	}
	console.log(`Créateur trouvé : ${creator.displayName ?? creator.email} (${creator.id})`);

	// 2. S'assurer que la catégorie "sport" existe
	const categorySlug = "sport";
	let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
	if (!category) {
		category = await prisma.category.create({
			data: {
				name: "Sport",
				slug: categorySlug,
				description: "Agents spécialisés dans le sport, le fitness et la performance",
				icon: "Trophy",
			},
		});
		console.log("Catégorie 'sport' créée.");
	}

	// 3. Chiffrer la clé Anthropic
	const encryptedKey = encrypt(anthropicKey);

	// 4. Créer l'agent
	const agentName = "SportCoach IA";
	const slug = `${slugify(agentName)}-${Date.now()}`;

	const agent = await prisma.agent.create({
		data: {
			name: agentName,
			slug,
			description: "Ton coach sportif IA — analyse tes performances, crée des programmes d'entraînement et répond à toutes tes questions sur le sport.",
			longDescription: `SportCoach IA est un assistant sportif expert propulsé par Claude.

**Ce qu'il peut faire :**
- Créer des programmes d'entraînement personnalisés (running, musculation, cyclisme, natation…)
- Analyser tes performances et proposer des ajustements
- Expliquer les règles et stratégies de n'importe quel sport
- Donner des conseils nutrition adaptés à l'effort
- Préparer mentalement avant une compétition
- Analyser des statistiques de matchs et de joueurs

**Sports couverts :** Football, Basketball, Tennis, Rugby, Natation, Athlétisme, Cyclisme, MMA, Yoga, CrossFit, et bien plus.`,
			category: categorySlug,
			tags: ["sport", "coaching", "fitness", "entraînement", "nutrition", "performance"],
			models: ["claude-haiku-4-5-20251001"],
			mode: "CLOUD",
			pricingModel: "FREE",
			price: 0,
			creditCost: 1,
			status: "APPROVED",
			systemPrompt: `Tu es SportCoach IA, un coach sportif expert et passionné.

Ton rôle :
- Analyser les besoins sportifs de l'utilisateur (niveau, objectifs, disponibilités, équipements)
- Créer des programmes d'entraînement structurés, progressifs et adaptés
- Expliquer la technique, la biomécanique et la science derrière chaque exercice
- Donner des conseils en nutrition sportive (hydratation, récupération, timing)
- Analyser les performances et proposer des ajustements concrets
- Parler de tous les sports avec une expertise pointue (règles, tactiques, statistiques)

Ton style :
- Enthousiaste mais professionnel, comme un vrai coach
- Toujours demander le contexte (blessures, niveau, équipement) avant de proposer un programme
- Structurer les réponses avec des listes et tableaux quand pertinent
- Encourager sans être condescendant
- Donner des sources ou explications scientifiques quand utile

Langue : réponds toujours dans la langue de l'utilisateur.`,
			cloudStrategy: "SELLER_API_KEY",
			sellerApiKeyEncrypted: encryptedKey,
			sellerApiProvider: "anthropic",
			creatorId: creator.id,
		} as any,
	});

	console.log("\n✅ Agent créé avec succès !");
	console.log(`   Nom     : ${agent.name}`);
	console.log(`   Slug    : ${agent.slug}`);
	console.log(`   ID      : ${agent.id}`);
	console.log(`   Status  : ${agent.status}`);
	console.log(`   Stratégie : SELLER_API_KEY (Anthropic)`);
	console.log(`\n   URL catalogue : http://localhost:3000/agents/${agent.id}`);
	console.log(`   URL chat      : http://localhost:3000/chat?agent=${agent.id}`);
}

main()
	.catch((e) => {
		console.error("\nErreur :", e.message);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
