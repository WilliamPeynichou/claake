export type Agent = {
	id: string;
	name: string;
	creator: string;
	category: string;
	price: number;
	free: boolean;
	rating: number;
	reviews: number;
	downloads: number;
	tags: string[];
	description: string;
	system: string;
	featured: boolean;
};

export type Chat = {
	agentId: string;
	title: string;
	last: string;
	preview: string;
};

export type Message = {
	id: string;
	role: "user" | "agent";
	text: string;
};

export const MOCK_AGENTS: Agent[] = [
	{
		id: "a1",
		name: "Juriste IA",
		creator: "me.cadet",
		category: "Juridique",
		price: 12,
		free: false,
		rating: 4.8,
		reviews: 124,
		downloads: 2340,
		tags: ["contrats", "rgpd", "français"],
		description: "Analyse et rédaction de contrats. Spécialiste du droit français et du RGPD.",
		system: "Tu es un juriste expert en droit français, spécialisé en droit des affaires et RGPD.",
		featured: true,
	},
	{
		id: "a2",
		name: "Code Review",
		creator: "raphael.c",
		category: "Dev",
		price: 0,
		free: true,
		rating: 4.6,
		reviews: 412,
		downloads: 9820,
		tags: ["typescript", "rust", "review"],
		description: "Relit ton code et propose des améliorations concrètes, langage-agnostique.",
		system: "Tu es un senior engineer qui review du code avec pragmatisme.",
		featured: true,
	},
	{
		id: "a3",
		name: "Plume",
		creator: "sofia.v",
		category: "Écriture",
		price: 5,
		free: false,
		rating: 4.9,
		reviews: 78,
		downloads: 1100,
		tags: ["copywriting", "brand", "fr"],
		description: "Co-pilote pour du copywriting de marque : punchy, sobre, sans jargon.",
		system: "Tu écris du copy de marque en français : ton direct, pas de jargon.",
		featured: false,
	},
	{
		id: "a4",
		name: "Atlas",
		creator: "team.claake",
		category: "Recherche",
		price: 0,
		free: true,
		rating: 4.4,
		reviews: 203,
		downloads: 5400,
		tags: ["search", "synthèse"],
		description: "Synthétise plusieurs sources en une note claire et citée.",
		system: "Tu résumes des sources longues en notes structurées.",
		featured: false,
	},
	{
		id: "a5",
		name: "Cuisinier",
		creator: "hugo.r",
		category: "Lifestyle",
		price: 3,
		free: false,
		rating: 4.7,
		reviews: 56,
		downloads: 890,
		tags: ["recettes", "saisonnier"],
		description: "Propose des recettes en fonction de ce que tu as dans le frigo.",
		system: "Tu suggères des recettes simples à partir d'ingrédients fournis.",
		featured: false,
	},
	{
		id: "a6",
		name: "Fiscalia",
		creator: "Claake",
		category: "Finance",
		price: 18,
		free: false,
		rating: 4.5,
		reviews: 34,
		downloads: 410,
		tags: ["impôts", "fr", "freelance"],
		description: "Optimise ta fiscalité de freelance et répond à tes questions courantes.",
		system: "Tu es un fiscaliste français spécialisé freelance et TPE.",
		featured: false,
	},
];

export const MOCK_CHATS: Chat[] = [
	{
		agentId: "a1",
		title: "Contrat prestation freelance",
		last: "Il y a 2 h",
		preview: "Pour l'article 7, je te propose…",
	},
	{
		agentId: "a2",
		title: "Review du module auth",
		last: "Hier",
		preview: "Attention, la fonction validateToken…",
	},
	{
		agentId: "a3",
		title: "Tagline nouvelle landing",
		last: "Lun.",
		preview: "Quatre pistes, de la plus sobre à la plus…",
	},
];

export const SAMPLE_THREAD: Message[] = [
	{
		id: "sample-1",
		role: "user",
		text: "Peux-tu me rédiger la clause de confidentialité pour un freelance dev ?",
	},
	{
		id: "sample-2",
		role: "agent",
		text: "Voici une clause adaptée, en trois paragraphes : définition des informations confidentielles, obligations de la partie réceptrice, et durée (standard 3 ans après fin du contrat). Je t'ajoute aussi une variante RGPD.",
	},
	{
		id: "sample-3",
		role: "user",
		text: "Parfait. Ajoute une clause pénale proportionnée.",
	},
	{
		id: "sample-4",
		role: "agent",
		text: "Entendu. Clause pénale : forfait de 5 000 € par violation caractérisée, sans préjudice des dommages-intérêts complémentaires. Je garde la rédaction sobre pour rester exécutable.",
	},
];

export const CATEGORIES = [
	"TOUS",
	"DEV",
	"ÉCRITURE",
	"JURIDIQUE",
	"FINANCE",
	"RECHERCHE",
	"LIFESTYLE",
];
